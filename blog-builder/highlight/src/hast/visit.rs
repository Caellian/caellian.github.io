use super::*;

#[derive(Default, PartialEq, Eq)]
pub enum Continuation {
    /// Traverse deeper
    #[default]
    Continue,
    /// Go to next sibling
    Skip,
    /// Stop iteration
    Exit,
}
pub use Continuation::*;
impl From<()> for Continuation {
    fn from(_: ()) -> Self {
        Continuation::Continue
    }
}
pub struct VisitationResult<D: Data> {
    pub continuation: Continuation,
    _phantom: std::marker::PhantomData<std::cell::Cell<D>>,
}
impl<D: Data> Default for VisitationResult<D> {
    fn default() -> Self {
        Self {
            _phantom: std::marker::PhantomData,
            continuation: Continuation::Continue,
        }
    }
}
impl<D: Data> From<VisitationResult<D>> for (Continuation) {
    fn from(value: VisitationResult<D>) -> Self {
        value.continuation
    }
}
impl<D: Data> From<()> for VisitationResult<D> {
    fn from(value: ()) -> Self {
        Self::default()
    }
}
impl<D: Data, I: Into<VisitationResult<D>>> From<Option<I>> for VisitationResult<D> {
    fn from(value: Option<I>) -> Self {
        match value {
            Some(it) => it.into(),
            None => Self::default(),
        }
    }
}
impl<D: Data> From<Continuation> for VisitationResult<D> {
    fn from(continuation: Continuation) -> Self {
        Self {
            _phantom: std::marker::PhantomData,
            continuation,
        }
    }
}

macro_rules! visitor_impl {
    ($(&$mut: tt)?) => {paste::paste!{
        pub enum [<$($mut:camel)? VisitAccess>]<'a, D: Data> {
            Root(&'a $($mut)? Node<D>),
            Child {
                parent: &'a $($mut)? Node<D>,
                index: usize,
            },
        }
        impl<'a, D: Data> [<$($mut:camel)? VisitAccess>]<'a, D> {
            pub fn item(&self) -> &Node<D> {
                match self {
                    Self::Root(it) => it,
                    Self::Child { parent, index } => parent.nth_child(*index).unwrap().into(),
                }
            }
            $(
                pub fn item_mut(&$mut self) -> &mut Node<D> {
                    match self {
                        Self::Root(it) => it,
                        Self::Child { parent, index } => parent.nth_child_mut(*index).unwrap().into(),
                    }
                }
            )?
            pub fn sibling(&self, offset: isize) -> Option<&Node<D>> {
                match self {
                    Self::Child { parent, index } if offset == 0 => return Some(self.item()),
                    Self::Child { parent, index }
                        if offset > 0 && (*index + offset as usize) < parent.len() =>
                    {
                        parent
                            .nth_child(*index + offset as usize)
                            .map(|it| it.into())
                    }
                    Self::Child { parent, index } if offset < 0 && *index >= -offset as usize => {
                        parent
                            .nth_child(*index + offset as usize)
                            .map(|it| it.into())
                    }
                    _ => None,
                }
            }
            $(
                pub fn sibling_mut(&$mut self, offset: isize) -> Option<&mut Node<D>> {
                    if offset == 0 {
                        return Some(self.item_mut());
                    }
                    let (parent, index) = match self {
                        Self::Root(_) => return None,
                        Self::Child { parent, index } => (parent, index),
                    };

                    if offset > 0 && (*index + offset as usize) < parent.len() {
                        return parent
                            .nth_child_mut(*index + offset as usize)
                            .map(|it| it.into());
                    }

                    if offset < 0 && *index >= -offset as usize {
                        return parent
                            .nth_child_mut(*index + offset as usize)
                            .map(|it| it.into());
                    }

                    None
                }
            )?
            #[inline]
            pub fn prev_sibling(&self) -> Option<&Node<D>> {
                return self.sibling(-1);
            }
            $(
                #[inline]
                pub fn prev_sibling_mut(&$mut self) -> Option<&mut Node<D>> {
                    return self.sibling_mut(-1);
                }
            )?
            #[inline]
            pub fn next_sibling(&self) -> Option<&Node<D>> {
                return self.sibling(1);
            }
            $(
                #[inline]
                pub fn next_sibling_mut(&$mut self) -> Option<&mut Node<D>> {
                    return self.sibling_mut(1);
                }
            )?
        }

        pub trait [<$($mut:camel)? VisitorFn>]<D: Data> {
            fn visit(&self, access: [<$($mut:camel)? VisitAccess>]<D>) -> Continuation;
        }
        impl<'a, D: Data + 'a, C: Into<VisitationResult<D>>, F> [<$($mut:camel)? VisitorFn>]<D> for F
        where
            F: Fn([<$($mut:camel)? VisitAccess>]<D>) -> C,
        {
            fn visit(&self, access: [<$($mut:camel)? VisitAccess>]<D>) -> Continuation {
                (self)(access).into().into()
            }
        }
    }};
}

visitor_impl!();
visitor_impl!(&mut);

pub fn visit<'a, D, V>(tree: impl Into<&'a Node<D>>, visitor: V)
where
    D: Data + 'a,
    V: VisitorFn<D>,
{
    let tree = tree.into();
    let mut remaining = VecDeque::with_capacity(1);
    let continuation = visitor.visit(VisitAccess::Root(tree));
    remaining.push_back(match continuation {
        Continuation::Continue => (tree, tree.iter_children().enumerate()),
        Continuation::Skip | Continuation::Exit => return,
    });
    while let Some((parent, mut local)) = remaining.pop_front() {
        while let Some((i, current)) = local.next() {
            let current_node: &'a Node<D> = current.into();
            let continuation = visitor.visit(VisitAccess::Child { parent, index: i });
            match continuation {
                Continuation::Continue => {
                    remaining.push_front((parent, local));
                    remaining.push_front((current_node, current_node.iter_children().enumerate()));
                    break;
                }
                Continuation::Skip => continue,
                Continuation::Exit => return,
            }
        }
    }
}

pub fn visit_mut<'a, D, V>(tree: impl Into<&'a mut Node<D>>, visitor: V)
where
    D: Data + 'a,
    V: MutVisitorFn<D>,
{
    let tree = tree.into();
    let mut remaining = VecDeque::with_capacity(1);

    let continuation = visitor.visit(MutVisitAccess::Root(tree));
    if tree.is_none() {
        return;
    }
    remaining.push_back(match continuation {
        Continuation::Continue => (tree, 0),
        Continuation::Skip | Continuation::Exit => return,
    });

    while let Some((parent, start_index)) = remaining.pop_front() {
        let mut i = start_index;
        while i < parent.len() {
            let start_state: Vec<_> = parent.iter_children().map(|it| it.id()).cloned().collect();
            let mut continuation = visitor.visit(MutVisitAccess::Child { parent, index: i });
            let end_state: Vec<_> = parent.iter_children().map(|it| it.id()).collect();

            let mut last_known = i;
            while last_known > 0 {
                
                last_known -= 1;
            }

            match continuation {
                Continuation::Continue => {
                    let child = unsafe {
                        /// SAFETY: TODO
                        std::mem::transmute::<&mut Node<D>, &'a mut Node<D>>(
                            parent.nth_child_mut(i).unwrap().into(),
                        )
                    };
                    remaining.push_front((parent, i + 1));
                    remaining.push_front((child, 0));
                    break;
                }
                Continuation::Skip => {
                    i += 1;
                }
                Continuation::Exit => return,
            }
        }
    }
}
