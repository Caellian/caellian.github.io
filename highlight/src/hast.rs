//! Structures for working with [unified](https://unifiedjs.com/) hast (HTML AST).

use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HastElement {
    pub tag_name: String,
    pub properties: HastProperties,
    pub children: Vec<HastNode>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HastProperties {
    pub class_name: String,
}

#[derive(Serialize)]
#[serde(tag = "type")]
pub enum HastNode {
    #[serde(rename = "element")]
    Element(HastElement),
    #[serde(rename = "text")]
    Text(HastTextNode),
}

impl HastNode {
    pub fn text(value: String) -> HastNode {
        HastNode::Text(HastTextNode { value })
    }
}

#[derive(Serialize)]
pub struct HastTextNode {
    pub value: String,
}
