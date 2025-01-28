#![allow(unused)]

use napi::{bindgen_prelude::ToNapiValue, Env, NapiRaw};
use std::{
    alloc::Layout,
    any::TypeId,
    boxed,
    collections::{HashMap, HashSet, VecDeque},
    default,
    fmt::Write,
    hash::Hash,
    iter::Enumerate,
    ops::{Deref, DerefMut, Sub},
    rc::Rc,
    slice::{Iter, IterMut},
    sync::{
        atomic::{AtomicU32, AtomicUsize},
        Arc,
    },
    vec,
};

pub mod visit;
pub use visit::Continuation;
pub mod data;
pub use data::{Data, Properties, PropertyValue};

#[derive(Debug, Clone)]
struct NodeIndex {
    index: usize,
    mutation: u32,
    mutation_source: Rc<AtomicU32>,
}
impl NodeIndex {
    #[inline]
    pub fn index(&self) -> usize {
        self.index
    }
    pub fn mutation(&self) -> usize {
        self.mutation as usize
    }
    pub fn with_mutation(mut self) -> Self {
        let was = self
            .mutation_source
            .fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        self.mutation = was + 1;
        self
    }
    pub fn has_changed(&self, previous_state: Self) -> bool {
        self.mutation() != previous_state.mutation()
    }
}
impl PartialEq for NodeIndex {
    /// Checks whether two indices reference the same node.
    ///
    /// Doesn't check for mutations.
    fn eq(&self, other: &Self) -> bool {
        self.index() == other.index()
    }
}
impl Eq for NodeIndex {}
impl Hash for NodeIndex {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.index.hash(state);
        self.mutation.hash(state);
    }
}

struct IndexGenerator {
    current: AtomicUsize,
}
impl IndexGenerator {
    pub const fn new() -> Self {
        IndexGenerator {
            current: AtomicUsize::new(0),
        }
    }
    pub fn next_node(&self) -> NodeIndex {
        NodeIndex {
            index: self
                .current
                .fetch_add(1, std::sync::atomic::Ordering::SeqCst),
            mutation: 0,
            mutation_source: Rc::new(AtomicU32::new(0)),
        }
    }
}

static INDEX: IndexGenerator = IndexGenerator::new();

#[derive(Debug)]
pub struct Element<D: Data> {
    id: NodeIndex,
    tag_name: String,
    properties: Properties,
    data: HashSet<D>,
    children: Vec<ElementChild<D>>,
}
impl<D: Data> Default for Element<D> {
    fn default() -> Self {
        Element::new("div")
    }
}
impl<D: Data> Element<D> {
    pub fn new(tag: impl AsRef<str>) -> Self {
        Element {
            id: INDEX.next_node(),
            tag_name: tag.as_ref().to_string(),
            properties: Properties::default(),
            data: HashSet::new(),
            children: vec![],
        }
    }
    pub fn id(&self) -> &NodeIndex {
        &self.id
    }
    pub fn tag(&self) -> &str {
        &self.tag_name
    }
    #[inline]
    pub fn has_class(&self, class: impl AsRef<str>) -> bool {
        self.properties.has_class(class)
    }
    #[inline]
    pub fn with_classes<S, I>(mut self, classes: I) -> Self
    where
        S: AsRef<str>,
        I: IntoIterator<Item = S>,
    {
        self.properties.add_classes(classes);
        self.id = self.id.with_mutation();
        self
    }
    pub fn children(&self) -> &[ElementChild<D>] {
        &self.children
    }
    pub fn children_mut(&mut self) -> &mut Vec<ElementChild<D>> {
        self.id = self.id.clone().with_mutation();
        &mut self.children
    }
    #[inline]
    pub fn iter_children(&self) -> Iter<'_, ElementChild<D>> {
        self.children.iter()
    }
    #[inline]
    pub fn iter_children_mut(&mut self) -> IterMut<'_, ElementChild<D>> {
        self.id = self.id.clone().with_mutation();
        self.children.iter_mut()
    }
    #[inline]
    pub fn len(&self) -> usize {
        self.children.len()
    }
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.children.is_empty()
    }
    #[inline]
    pub fn push_child(&mut self, child: impl Into<ElementChild<D>>) {
        self.id = self.id.clone().with_mutation();
        self.children.push(child.into());
    }
    pub fn with_properties<S, P, I>(mut self, additional_properties: I) -> Self
    where
        S: AsRef<str>,
        P: Into<PropertyValue>,
        I: IntoIterator<Item = (S, P)>,
    {
        self.id = self.id.clone().with_mutation();
        self.properties.extend(additional_properties);
        self
    }
    #[inline]
    pub fn properties(&self) -> &Properties {
        &self.properties
    }
    #[inline]
    pub fn properties_mut(&mut self) -> &mut Properties {
        &mut self.properties
    }
    #[inline]
    pub fn with_data(mut self, data: D) -> Self {
        self.data.insert(data);
        self
    }
    #[inline]
    pub fn set_data(&mut self, data: D) {
        self.data.insert(data);
    }
    pub fn get_data(&self, key: impl AsRef<str>) -> Option<&D> {
        let key = key.as_ref();
        self.data.iter().find(|it| it.name() == key)
    }
    #[inline]
    pub fn extend_data<I>(&mut self, data: I)
    where
        I: IntoIterator<Item = D>,
    {
        for entry in data {
            self.set_data(entry)
        }
    }
    pub fn text_content_to_buffer(&self, buffer: &mut String) -> std::io::Result<()> {
        let mut queue = VecDeque::with_capacity(self.children.len());
        for child in &self.children {
            queue.push_back(child);
        }
        while let Some(next) = queue.pop_front() {
            match next {
                ElementChild::Element(element) => {
                    for child in element.children.iter().rev() {
                        queue.push_front(child)
                    }
                }
                ElementChild::Text(content) => {
                    if buffer.write_str(content.as_str()).is_err() {
                        return Err(std::io::Error::new(
                            std::io::ErrorKind::OutOfMemory,
                            "can't append text element content to buffer",
                        ));
                    }
                }
            }
        }
        Ok(())
    }
    #[inline]
    pub fn text_content(&self) -> std::io::Result<String> {
        let mut buffer = String::with_capacity(1024);
        self.text_content_to_buffer(&mut buffer)?;
        Ok(buffer)
    }
    #[inline]
    pub fn is_same_node(&self, other: &Self) -> bool {
        self.id == other.id
    }
}
impl<D: Data + Clone> Clone for Element<D> {
    fn clone(&self) -> Self {
        Element {
            id: INDEX.next_node(),
            tag_name: self.tag_name.clone(),
            properties: self.properties.clone(),
            data: self.data.clone(),
            children: self.children.clone(),
        }
    }
}
impl<D: Data> PartialEq for Element<D> {
    fn eq(&self, other: &Self) -> bool {
        self.tag_name == other.tag_name
            && self.properties == other.properties
            && self.data == other.data
            && self.children == other.children
    }
}
impl<D: Data> Eq for Element<D> {}
impl<D: Data> std::hash::Hash for Element<D> {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.tag_name.hash(state);
        self.properties.hash(state);
        for data in &self.data {
            data.hash(state);
        }
        self.children.hash(state);
    }
}

impl<D: Data> ToNapiValue for Element<D> {
    unsafe fn to_napi_value(
        env_ptr: napi::sys::napi_env,
        this: Self,
    ) -> napi::Result<napi::sys::napi_value> {
        let env = Env::from_raw(env_ptr);
        let mut result = env.create_object()?;
        result.set("type", "element")?;
        result.set("tagName", &this.tag_name)?;
        result.set(
            "properties",
            ToNapiValue::to_napi_value(env_ptr, this.properties)?,
        )?;
        if !this.data.is_empty() {
            let mut data = env.create_object()?;
            for value in this.data {
                let name = value.name();
                let value = ToNapiValue::to_napi_value(env_ptr, value)?;
                data.set(name, value)?;
            }
            result.set("data", data)?;
        }
        let mut children = Vec::with_capacity(this.children.len());
        for child in this.children {
            if child.is_none() {
                continue;
            }
            children.push(ToNapiValue::to_napi_value(env_ptr, child))
        }
        result.set("children", children)?;
        Ok(result.raw())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Text {
    id: NodeIndex,
    value: String,
}
impl Default for Text {
    fn default() -> Self {
        Self::new("")
    }
}
impl Text {
    #[inline]
    pub fn new(value: impl AsRef<str>) -> Self {
        Text {
            id: INDEX.next_node(),
            value: value.as_ref().to_string(),
        }
    }
    fn id(&self) -> &NodeIndex {
        &self.id
    }
    #[inline]
    pub fn as_str(&self) -> &str {
        &self.value
    }
    #[inline]
    pub fn len(&self) -> usize {
        self.value.len()
    }
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.value.is_empty()
    }
    #[inline]
    pub fn push_str(&mut self, string: impl AsRef<str>) {
        self.value.push_str(string.as_ref())
    }
}
impl AsRef<str> for Text {
    #[inline]
    fn as_ref(&self) -> &str {
        &self.value
    }
}
impl ToNapiValue for Text {
    unsafe fn to_napi_value(
        env: napi::sys::napi_env,
        this: Self,
    ) -> napi::Result<napi::sys::napi_value> {
        let env = Env::from_raw(env);
        let mut result = env.create_object()?;
        result.set("type", "text")?;
        result.set("value", &this.value)?;
        Ok(result.raw())
    }
}

/// Document node type
///
/// Spec: https://dom.spec.whatwg.org/#ref-for-dom-node-nodetype%E2%91%A0
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum NodeType {
    None = 0,
    Element = 1,
    Attribute = 2,
    Text = 3,
    CData = 4,
    ProcessingInstruction = 7,
    Comment = 8,
    Document = 9,
    DocumentType = 10,
    DocumentFragment = 11,
}

impl TryFrom<u8> for NodeType {
    type Error = Error;
    fn try_from(value: u8) -> Result<Self, Error> {
        Ok(match value {
            0 => Self::None,
            1 => Self::Element,
            2 => Self::Attribute,
            3 => Self::Text,
            4 => Self::CData,
            7 => Self::ProcessingInstruction,
            8 => Self::Comment,
            9 => Self::Document,
            10 => Self::DocumentType,
            11 => Self::DocumentFragment,
            other => return Err(Error::InvalidNodeKind(other)),
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
#[repr(u8, C)]
pub enum ElementChild<D: Data> {
    Element(Box<Element<D>>) = NodeType::Element as u8,
    Text(Box<Text>) = NodeType::Text as u8,
}
impl<D: Data> ElementChild<D> {
    fn id(&self) -> &NodeIndex {
        match self {
            ElementChild::Element(el) => el.id(),
            ElementChild::Text(text) => text.id(),
        }
    }
}
impl<D: Data> From<Element<D>> for ElementChild<D> {
    fn from(value: Element<D>) -> Self {
        ElementChild::Element(Box::new(value))
    }
}
impl<D: Data> From<Text> for ElementChild<D> {
    #[inline]
    fn from(value: Text) -> Self {
        ElementChild::Text(Box::new(value))
    }
}
impl<D: Data> From<ElementChild<D>> for Node<D> {
    fn from(value: ElementChild<D>) -> Self {
        match value {
            ElementChild::Element(element) => Node::Element(element),
            ElementChild::Text(text) => Node::Text(text),
        }
    }
}
impl<'a, D: Data> From<&'a ElementChild<D>> for &'a Node<D> {
    #[inline]
    fn from(value: &'a ElementChild<D>) -> Self {
        unsafe {
            // SAFETY: ElementChild and Node have same layout, only Node has an
            // additional Root variant
            std::mem::transmute(value)
        }
    }
}
impl<'a, D: Data> From<&'a mut ElementChild<D>> for &'a mut Node<D> {
    #[inline]
    fn from(value: &'a mut ElementChild<D>) -> Self {
        unsafe {
            // SAFETY: ElementChild and Node have same layout, only Node has an
            // additional Root variant
            std::mem::transmute(value)
        }
    }
}

impl<D: Data> Deref for ElementChild<D> {
    type Target = Node<D>;

    #[inline]
    fn deref(&self) -> &Self::Target {
        self.into()
    }
}
impl<D: Data> DerefMut for ElementChild<D> {
    #[inline]
    fn deref_mut(&mut self) -> &mut Self::Target {
        self.into()
    }
}
impl<D: Data> std::hash::Hash for ElementChild<D> {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        core::mem::discriminant(self).hash(state);
        match self {
            ElementChild::Element(element) => element.as_ref().hash(state),
            ElementChild::Text(_) => todo!(),
        }
    }
}

impl<D: Data> ToNapiValue for ElementChild<D> {
    unsafe fn to_napi_value(
        env: napi::sys::napi_env,
        this: Self,
    ) -> napi::Result<napi::sys::napi_value> {
        Ok(match this {
            ElementChild::Element(element) => ToNapiValue::to_napi_value(env, *element)?,
            ElementChild::Text(text) => ToNapiValue::to_napi_value(env, *text)?,
        })
    }
}

#[derive(Debug, Default, Clone, PartialEq)]
#[repr(u8, C)]
pub enum Node<D: Data> {
    #[default]
    None = NodeType::None as u8,
    Element(Box<Element<D>>) = NodeType::Element as u8,
    Text(Box<Text>) = NodeType::Text as u8,
}
impl<D: Data> Node<D> {
    #[inline]
    pub fn text(value: impl AsRef<str>) -> Self {
        Node::from(Text::new(value))
    }
    pub fn kind(&self) -> NodeType {
        unsafe {
            // SAFETY: discriminant is located first in layout
            let discriminant = *(std::ptr::from_ref(self) as *const u8)
                .as_ref()
                .unwrap_unchecked();
            // SAFETY: Discriminant is defined via NodeKind
            NodeType::try_from(discriminant).unwrap_unchecked()
        }
    }
    pub fn is_none(&self) -> bool {
        matches!(self, Node::None)
    }
    #[inline]
    pub fn is_some(&self) -> bool {
        !self.is_none()
    }
    pub fn as_text(&self) -> Option<&Text> {
        match self {
            Node::Text(it) => Some(it),
            _ => None,
        }
    }
    pub fn as_text_mut(&mut self) -> Option<&mut Text> {
        match self {
            Node::Text(it) => Some(it.as_mut()),
            _ => None,
        }
    }
    pub fn as_element(&self) -> Option<&Element<D>> {
        match self {
            Node::Element(root) => Some(root),
            _ => None,
        }
    }
    pub fn as_element_mut(&mut self) -> Option<&mut Element<D>> {
        match self {
            Node::Element(it) => Some(it.as_mut()),
            _ => None,
        }
    }

    pub fn children(&self) -> &[ElementChild<D>] {
        self.as_element()
            .map(|it| it.children.as_slice())
            .unwrap_or(&[])
    }
    pub fn children_mut(&mut self) -> Option<&mut Vec<ElementChild<D>>> {
        self.as_element_mut().map(|it| it.children.as_mut())
    }
    #[inline]
    pub fn iter_children(&self) -> Iter<'_, ElementChild<D>> {
        self.children().iter()
    }
    pub fn iter_children_mut(&mut self) -> IterMut<'_, ElementChild<D>> {
        self.children_mut()
            .map(|it| it.iter_mut())
            .unwrap_or([].iter_mut())
    }
    #[inline]
    pub fn nth_child(&self, index: usize) -> Option<&ElementChild<D>> {
        self.children().get(index)
    }
    #[inline]
    pub fn nth_child_mut(&mut self, index: usize) -> Option<&mut ElementChild<D>> {
        self.children_mut().and_then(|it| it.get_mut(index))
    }
    pub fn has_class(&self, class: impl AsRef<str>) -> bool {
        self.as_element()
            .map(|it| it.has_class(class))
            .unwrap_or_default()
    }
    pub fn text_content_to_buffer(&self, buffer: &mut String) -> std::io::Result<()> {
        match self {
            Node::None => return Ok(()),
            Node::Element(element) => element.text_content_to_buffer(buffer)?,
            Node::Text(text) => {
                if buffer.write_str(text.as_str()).is_err() {
                    return Err(std::io::Error::new(
                        std::io::ErrorKind::OutOfMemory,
                        "can't append text element content to buffer",
                    ));
                }
            }
        }
        Ok(())
    }
    pub fn text_content(&self) -> std::io::Result<String> {
        match self {
            Node::None => Ok(String::new()),
            Node::Element(element) => element.text_content(),
            Node::Text(text) => Ok(text.value.clone()),
        }
    }
    #[inline]
    pub fn len(&self) -> usize {
        self.children().len()
    }
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }
}

// DerefMut causes errors when used with functions that take self by value. So,
// as a workaround, implement those directly for Node as well as any structs
// which implement DerefMut cast into Node.
macro_rules! has_element {
    ($($T: ty),* $(,)?) => {
        $(
            impl<D: Data> $T {
                pub fn into_element(self) -> Result<Element<D>, Self> {
                    match self {
                        Self::Element(it) => Ok(*it),
                        other => Err(other),
                    }
                }
            }
        )*
    };
}
macro_rules! has_text {
    ($($T: ty),* $(,)?) => {
        $(
            impl<D: Data> $T {
                pub fn into_text(self) -> Result<Text, Self> {
                    match self {
                        Self::Text(it) => Ok(*it),
                        other => Err(other),
                    }
                }
            }
        )*
    };
}
has_element![Node<D>, ElementChild<D>, ParentElement<D>];
has_text![Node<D>, ElementChild<D>];

impl<D: Data> From<Element<D>> for Node<D> {
    #[inline]
    fn from(value: Element<D>) -> Self {
        Node::Element(Box::new(value))
    }
}
impl<D: Data> From<Text> for Node<D> {
    #[inline]
    fn from(value: Text) -> Self {
        Node::Text(Box::new(value))
    }
}
impl<D: Data> TryFrom<Node<D>> for ElementChild<D> {
    type Error = Error;
    fn try_from(value: Node<D>) -> Result<Self, Self::Error> {
        Ok(match value {
            Node::Element(element) => ElementChild::Element(element),
            Node::Text(text) => ElementChild::Text(text),
            _ => return Err(Error::NotElementChild("root")),
        })
    }
}
impl<'a, D: Data> TryFrom<&'a Node<D>> for &'a ElementChild<D> {
    type Error = Error;

    #[inline]
    fn try_from(value: &'a Node<D>) -> Result<Self, Self::Error> {
        Ok(unsafe {
            // SAFETY: ElementChild and Node have same layout
            std::mem::transmute::<&Node<D>, &ElementChild<D>>(value)
        })
    }
}
impl<'a, D: Data> TryFrom<&'a mut Node<D>> for &'a mut ElementChild<D> {
    type Error = Error;

    #[inline]
    fn try_from(value: &'a mut Node<D>) -> Result<Self, Self::Error> {
        Ok(unsafe {
            // SAFETY: ElementChild and Node have same layout
            std::mem::transmute::<&mut Node<D>, &mut ElementChild<D>>(value)
        })
    }
}
impl<D: Data> ToNapiValue for Node<D> {
    unsafe fn to_napi_value(
        env: napi::sys::napi_env,
        this: Self,
    ) -> napi::Result<napi::sys::napi_value> {
        Ok(match this {
            Node::None => Env::from_raw(env).get_null()?.raw(),
            Node::Element(element) => ToNapiValue::to_napi_value(env, *element)?,
            Node::Text(text) => ToNapiValue::to_napi_value(env, *text)?,
        })
    }
}

#[repr(u8, C)]
pub enum ParentElement<D: Data> {
    None = NodeType::None as u8,
    Element(Box<Element<D>>) = NodeType::Text as u8,
}
impl<D: Data> From<ParentElement<D>> for Node<D> {
    fn from(value: ParentElement<D>) -> Self {
        match value {
            ParentElement::None => Node::None,
            ParentElement::Element(node) => Node::Element(node),
        }
    }
}
impl<D: Data> From<&ParentElement<D>> for &Node<D> {
    fn from(value: &ParentElement<D>) -> Self {
        unsafe {
            // SAFETY: ParentElement and Node have same layout; Node encompases ParentElement
            std::mem::transmute::<&ParentElement<D>, &Node<D>>(value)
        }
    }
}
impl<D: Data> From<&mut ParentElement<D>> for &mut Node<D> {
    fn from(value: &mut ParentElement<D>) -> Self {
        unsafe {
            // SAFETY: ParentElement and Node have same layout; Node encompases ParentElement
            std::mem::transmute::<&mut ParentElement<D>, &mut Node<D>>(value)
        }
    }
}
impl<D: Data> Deref for ParentElement<D> {
    type Target = Node<D>;

    #[inline]
    fn deref(&self) -> &Self::Target {
        self.into()
    }
}
impl<D: Data> DerefMut for ParentElement<D> {
    #[inline]
    fn deref_mut(&mut self) -> &mut Self::Target {
        self.into()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum Infallible {}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("node with {0} data is not a valid element child")]
    NotElementChild(&'static str),
    #[error("invalid node kind: {0:X}")]
    InvalidNodeKind(u8),
}

impl From<Error> for napi::Error {
    fn from(value: Error) -> napi::Error {
        napi::Error::new(napi::Status::Unknown, value.to_string())
    }
}
