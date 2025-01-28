use super::*;

pub trait Data: ToNapiValue + PartialEq + Eq + Hash {
    type Item: Copy + Eq;
    fn kind(&self) -> Self::Item;
    fn name(&self) -> &'static str;
}

#[doc(hidden)]
pub mod _impl {
    pub trait DataValue {
        fn eq(&self, other: &Self) -> bool;
        fn hash<H: std::hash::Hasher>(&self, state: &mut H);
    }

    macro_rules! default_impls {
        ($($T: ty),*) => {
            $(
                impl DataValue for $T {
                    fn eq(&self, other: &Self) -> bool {
                        std::cmp::PartialEq::eq(self, other)
                    }

                    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
                        std::hash::Hash::hash(&self, state)
                    }
                }
            )*
        };
    }
    default_impls![
        u8, u16, u32, u64, u128, usize, i8, i16, i32, i64, i128, isize, &str, String, bool
    ];

    impl DataValue for f32 {
        fn eq(&self, other: &Self) -> bool {
            std::cmp::PartialEq::eq(
                &ordered_float::OrderedFloat(*self),
                &ordered_float::OrderedFloat(*other),
            )
        }

        fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
            std::hash::Hash::hash(&ordered_float::OrderedFloat(*self), state)
        }
    }
    impl DataValue for f64 {
        fn eq(&self, other: &Self) -> bool {
            std::cmp::PartialEq::eq(
                &ordered_float::OrderedFloat(*self),
                &ordered_float::OrderedFloat(*other),
            )
        }

        fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
            std::hash::Hash::hash(&ordered_float::OrderedFloat(*self), state)
        }
    }

    macro_rules! impl_tuples {
        () => {
            impl DataValue for () {
                fn eq(&self, other: &Self) -> bool {
                    true
                }
                fn hash<H: std::hash::Hasher>(&self, state: &mut H) {}
            }
        };
        ($A:ident : $i: literal) => {
            impl<$A: DataValue> DataValue for ($A,) {
                fn eq(&self, other: &Self) -> bool {
                    DataValue::eq(&self.0, &other.0)
                }
                fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
                    DataValue::hash(&self.0, state)
                }
            }
        };
        ($A:ident: $i: tt, $($B:ident: $j: tt),*) => {
            impl_tuples!($($B: $j),*);
            impl<$A, $($B),*> DataValue for ($A, $($B),*) where
            $A: DataValue,
            $(
                $B: DataValue
            ),* {
                fn eq(&self, other: &Self) -> bool {
                    DataValue::eq(&self.$i, &other.$i)
                    $(&& DataValue::eq(&self.$j, &other.$j))*
                }
                fn hash<Hasher: std::hash::Hasher>(&self, state: &mut Hasher) {
                    DataValue::hash(&self.$i, state)
                }
            }
        };
    }
    impl_tuples!(L: 11, K: 10, J: 9, I: 8, H: 7, G: 6, F: 5, E: 4, D: 3, C: 2, B: 1, A: 0);
}

#[doc(hidden)]
#[macro_export]
macro_rules! __hast_data_impl {
    ($name: ident {$(
        $variant: ident ($(
            $value: ident : $value_t: ty
        ),*) => |$env: ident| $conv:block
    ),* $(,)?}) => {paste::paste!{
        impl $name {
            pub const ENTRIES: &[[<$name Item>]] = &[$([<$name Item>]::$variant),*];
        }
        impl $crate::hast::Data for $name {
            type Item = [<$name Item>];
            fn kind(&self) -> Self::Item {
                match self {
                    $(
                        Self::$variant(..) => [<$name Item>]::$variant,
                    )*
                }
            }
            fn name(&self) -> &'static str {
                match self {
                    $(
                        Self::$variant(..) => stringify!([<$variant:lowerCamel>]),
                    )*
                }
            }
        }
        impl PartialEq for $name {
            fn eq(&self, other: &Self) -> bool {
                match (self, other) {
                    $(
                        (Self::$variant(
                            $([<a_ $value>]),*
                        ), Self::$variant(
                            $([<b_ $value>]),*
                        )) if std::mem::discriminant(self) == std::mem::discriminant(other) => {
                            $crate::hast::data::_impl::DataValue::eq(($([<a_ $value>]),*), ($([<b_ $value>]),*))
                        },
                    )*
                    _ => false,
                }
            }
        }
        impl Eq for $name {}
        impl std::hash::Hash for $name {
            fn hash<H: std::hash::Hasher>(&self, state: &mut H)  {
                match self {
                    $(
                        Self::$variant($($value),*) => {
                            $crate::hast::data::_impl::DataValue::hash(($($value),*), state)
                        },
                    )*
                }
            }
        }
        impl napi::bindgen_prelude::ToNapiValue for $name {
            #[allow(unused_variables)]
            unsafe fn to_napi_value(env: napi::sys::napi_env, this: Self) -> napi::Result<napi::sys::napi_value> {
                let env = napi::Env::from_raw(env);
                match this {
                    $(
                        Self::$variant($($value),*) => {
                            let result = (|$env: napi::Env| $conv)(env)?;
                            let result = result.into_unknown();
                            Ok(napi::NapiRaw::raw(&result))
                        },
                    )*
                }
            }
        }
    }};
}

#[doc(hidden)]
#[macro_export]
macro_rules! __hast_data_decl {
    (pub $name: ident {$(
        $variant: ident ($(
            $value: ident : $value_t: ty
        ),*) => |$env: ident| $conv:block
    ),* $(,)?}) => {paste::paste!{
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
        pub enum [<$name Item>] {
            $($variant),*
        }
        #[derive(Debug, Clone)]
        #[repr(u8, C)]
        pub enum $name {
            $($variant ($($value_t),*) = [<$name Item>]::$variant as u8),*
        }
        $crate::__hast_data_impl!($name {$(
            $variant ($($value: $value_t),*) => |$env| $conv
        ),*});
    }};
    ($name: ident {$(
        $variant: ident ($(
            $value: ident : $value_t: ty
        ),*) => |$env: ident| $conv:block
    ),* $(,)?}) => {paste::paste!{
        #[derive(Debug, Clone, PartialEq)]
        enum $name {
            $($variant ($($value_t),*)),*
        }
        $crate::__hast_data_impl!($name {$(
            $variant ($($value: $value_t),*) => |$env| $conv
        ),*});
    }};
}
pub use crate::__hast_data_decl as hast_data;
use std::{collections::BTreeMap, hash::Hash, os::linux::raw::stat};

#[derive(Debug, Clone)]
pub enum PropertyValue {
    Boolean(bool),
    Number(f64),
    String(String),
    Null,
    Undefined,
    StringArray(Vec<String>),
    NumberArray(Vec<f64>),
}
impl PropertyValue {
    pub fn as_bool(&self) -> Option<bool> {
        if let PropertyValue::Boolean(value) = self {
            Some(*value)
        } else {
            None
        }
    }
    pub fn as_string(&self) -> Option<&String> {
        if let PropertyValue::String(value) = self {
            Some(value)
        } else {
            None
        }
    }
    pub fn as_str(&self) -> Option<&str> {
        if let PropertyValue::String(value) = self {
            Some(value.as_str())
        } else {
            None
        }
    }
    pub fn is_null(&self) -> bool {
        matches!(self, PropertyValue::Null)
    }
    pub fn is_undefined(&self) -> bool {
        matches!(self, PropertyValue::Undefined)
    }
    // Fuzzy `null` and `undefined` comparison
    pub fn is_empty(&self) -> bool {
        matches!(self, PropertyValue::Null | PropertyValue::Undefined)
    }
    pub fn is_truthy(&self) -> bool {
        match self {
            PropertyValue::Boolean(false) => false,
            PropertyValue::Number(it) if *it == 0.0 => false,
            PropertyValue::Null => false,
            PropertyValue::Undefined => false,
            _ => true,
        }
    }
    pub fn is_array(&self) -> bool {
        matches!(
            self,
            PropertyValue::StringArray(_) | PropertyValue::NumberArray(_)
        )
    }
    pub fn as_string_array(&self) -> Option<&Vec<String>> {
        if let PropertyValue::StringArray(value) = self {
            Some(value)
        } else {
            None
        }
    }
    pub fn as_string_array_mut(&mut self) -> Option<&mut Vec<String>> {
        if let PropertyValue::StringArray(value) = self {
            Some(value)
        } else {
            None
        }
    }
    pub fn as_number_array(&self) -> Option<&Vec<f64>> {
        if let PropertyValue::NumberArray(value) = self {
            Some(value)
        } else {
            None
        }
    }
    pub fn as_number_array_mut(&mut self) -> Option<&mut Vec<f64>> {
        if let PropertyValue::NumberArray(value) = self {
            Some(value)
        } else {
            None
        }
    }
    pub fn len(&self) -> Option<usize> {
        Some(match self {
            PropertyValue::String(string) => string.len(),
            PropertyValue::StringArray(array) => array.len(),
            PropertyValue::NumberArray(array) => array.len(),
            _ => return None,
        })
    }
}
macro_rules! property_value_as_number {
    ($($number: ty),*) => {
        impl PropertyValue {paste::paste!{
            $(
                pub fn [<as_ $number>](&self) -> Option<$number> {
                    if let PropertyValue::Number(value) = self {
                        Some(*value as $number)
                    } else {
                        None
                    }
                }
                pub fn [<as_ $number _fuzzy>](&self) -> $number {
                    if let PropertyValue::Number(value) = self {
                        *value as $number
                    } else if self.is_truthy() {
                        1 as $number
                    } else {
                        0 as $number
                    }
                }
                pub fn [<unwrap_ $number>](&self) -> $number {
                    if let PropertyValue::Number(value) = self {
                        *value as $number
                    } else {
                        panic!("property value not a number")
                    }
                }
            )*
        }}

        $(
            impl From<$number> for PropertyValue {
                fn from(value: $number) -> Self {
                    PropertyValue::Number(value as f64)
                }
            }
            impl From<Vec<$number>> for PropertyValue {
                fn from(value: Vec<$number>) -> Self {
                    PropertyValue::NumberArray(value.into_iter().map(|it| it as f64).collect())
                }
            }
        )*
    };
}
property_value_as_number![u8, u16, u32, u64, u128, i8, i16, i32, i64, i128, f32, f64];
macro_rules! property_value_from_string_like {
    (&$life: lifetime $T: ty) => {
        impl <$life> From<&$life $T> for PropertyValue {
            fn from(value: &$life$T) -> Self {
                PropertyValue::String(value.to_string())
            }
        }
    };
    ($T: ty) => {
        impl From<$T> for PropertyValue {
            fn from(value: $T) -> Self {
                PropertyValue::String(value.to_string())
            }
        }
    };
}
property_value_from_string_like!(&'a str);
property_value_from_string_like!(&'a String);
property_value_from_string_like!(String);

impl From<Vec<String>> for PropertyValue {
    fn from(value: Vec<String>) -> Self {
        PropertyValue::StringArray(value)
    }
}
impl From<()> for PropertyValue {
    fn from(value: ()) -> Self {
        PropertyValue::Undefined
    }
}
impl<V: Into<PropertyValue>> From<Option<V>> for PropertyValue {
    fn from(value: Option<V>) -> Self {
        match value {
            Some(it) => it.into(),
            None => PropertyValue::Null,
        }
    }
}
impl ToNapiValue for PropertyValue {
    unsafe fn to_napi_value(
        env: napi_sys::napi_env,
        this: Self,
    ) -> napi::Result<napi_sys::napi_value> {
        let env = Env::from_raw(env);
        Ok(match this {
            PropertyValue::Boolean(value) => env.get_boolean(value)?.raw(),
            PropertyValue::Number(value) => env.create_double(value)?.raw(),
            PropertyValue::String(value) => env.create_string_from_std(value)?.raw(),
            PropertyValue::Null => env.get_null()?.raw(),
            PropertyValue::Undefined => env.get_undefined()?.raw(),
            PropertyValue::StringArray(value) => {
                let mut arr = env.create_array_with_length(value.len())?;
                for (i, value) in value.into_iter().enumerate() {
                    let value = env.create_string_from_std(value)?;
                    arr.set_element(i as u32, value);
                }
                arr.raw()
            }
            PropertyValue::NumberArray(value) => {
                let mut arr = env.create_array_with_length(value.len())?;
                for (i, value) in value.into_iter().enumerate() {
                    let value = env.create_double(value)?;
                    arr.set_element(i as u32, value);
                }
                arr.raw()
            }
        })
    }
}

impl PartialEq for PropertyValue {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (Self::Boolean(left), Self::Boolean(right)) => left == right,
            (Self::Number(left), Self::Number(right)) => {
                ordered_float::OrderedFloat(*left) == ordered_float::OrderedFloat(*right)
            }
            (Self::String(left), Self::String(right)) => left == right,
            (Self::StringArray(left), Self::StringArray(right)) => left == right,
            (Self::NumberArray(left), Self::NumberArray(right)) => left
                .iter()
                .zip(right.iter())
                .all(|(l, r)| ordered_float::OrderedFloat(*l) == ordered_float::OrderedFloat(*r)),
            _ => core::mem::discriminant(self) == core::mem::discriminant(other),
        }
    }
}
impl Eq for PropertyValue {}
impl Hash for PropertyValue {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        core::mem::discriminant(self).hash(state);
        match self {
            PropertyValue::Boolean(v) => v.hash(state),
            PropertyValue::Number(v) => ordered_float::OrderedFloat(*v).hash(state),
            PropertyValue::String(v) => v.hash(state),
            PropertyValue::StringArray(v) => v.hash(state),
            PropertyValue::NumberArray(v) => {
                for v in v {
                    ordered_float::OrderedFloat(*v).hash(state);
                }
            }
            _ => {}
        }
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct Properties {
    properties: BTreeMap<String, PropertyValue>,
}
impl Properties {
    pub fn new<I>(values: I) -> Self
    where
        I: IntoIterator<Item = (String, PropertyValue)>,
    {
        Properties {
            properties: BTreeMap::from_iter(values),
        }
    }
    pub fn from_class_names<I, S>(classes: I) -> Self
    where
        S: AsRef<str>,
        I: IntoIterator<Item = S>,
    {
        Properties {
            properties: BTreeMap::from_iter(std::iter::once((
                "className".to_string(),
                PropertyValue::from(
                    classes
                        .into_iter()
                        .map(|it| it.as_ref().to_string())
                        .collect::<Vec<String>>(),
                ),
            ))),
        }
    }
    pub fn class_name(&self) -> &[String] {
        match self.get("className") {
            Some(PropertyValue::StringArray(class_name)) => class_name,
            _ => &[],
        }
    }
    pub fn add_classes<I, S>(&mut self, classes: I)
    where
        S: AsRef<str>,
        I: IntoIterator<Item = S>,
    {
        let classes = classes.into_iter().map(|it| it.as_ref().to_string());
        let mut value = match self.get_mut("className") {
            Some(PropertyValue::StringArray(value)) => {
                let mut result = std::mem::take(value);
                result.extend(classes);
                result
            }
            _ => Vec::from_iter(classes),
        };
        self.properties
            .insert("className".to_string(), PropertyValue::StringArray(value));
    }
    pub fn add_class(&mut self, class: impl AsRef<str>) {
        let mut value = match self.get_mut("className") {
            Some(PropertyValue::StringArray(value)) => std::mem::take(value),
            _ => Vec::with_capacity(1),
        };
        value.push(class.as_ref().to_string());
        self.properties
            .insert("className".to_string(), PropertyValue::StringArray(value));
    }
    pub fn has_class(&self, class: impl AsRef<str>) -> bool {
        self.class_name().iter().any(|it| it == class.as_ref())
    }
    pub fn set(&mut self, key: impl AsRef<str>, value: impl Into<PropertyValue>) {
        self.properties
            .insert(key.as_ref().to_string(), value.into());
    }
    #[inline]
    pub fn get(&self, key: impl AsRef<str>) -> Option<&PropertyValue> {
        self.properties.get(key.as_ref())
    }
    #[inline]
    pub fn get_mut(&mut self, key: impl AsRef<str>) -> Option<&mut PropertyValue> {
        self.properties.get_mut(key.as_ref())
    }
    #[inline]
    pub fn clear(&mut self) {
        self.properties.clear()
    }
    #[inline]
    pub fn len(&self) -> usize {
        self.properties.len()
    }
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.properties.is_empty()
    }

    pub fn iter(&self) -> impl Iterator<Item = (&'_ str, &'_ PropertyValue)> + '_ {
        self.properties.iter().map(|(k, v)| (k.as_str(), v))
    }
    pub fn extend<S, P, I>(&mut self, iter: I)
    where
        S: AsRef<str>,
        P: Into<PropertyValue>,
        I: IntoIterator<Item = (S, P)>,
    {
        self.properties.extend(
            iter.into_iter()
                .map(|(k, v)| (k.as_ref().to_string(), v.into())),
        )
    }
}
impl Hash for Properties {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        for (key, value) in self.properties.iter() {
            key.hash(state);
            value.hash(state);
        }
    }
}
impl ToNapiValue for Properties {
    unsafe fn to_napi_value(
        env: napi::sys::napi_env,
        this: Self,
    ) -> napi::Result<napi::sys::napi_value> {
        let env = Env::from_raw(env);
        let mut result = env.create_object()?;
        if !this.properties.is_empty() {
            for (key, value) in this.properties {
                if value.is_undefined() {
                    continue;
                } else {
                    result.set(key, value);
                }
            }
        }
        Ok(result.raw())
    }
}
