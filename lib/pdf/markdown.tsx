import { Text, View } from "@react-pdf/renderer";
import type { ListItem, PhrasingContent, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { styles } from "./styles";
import { BRAND, TYPE } from "./theme";

const HEADING_SIZE: Readonly<Record<number, number>> = { 1: TYPE.h3, 2: TYPE.h4, 3: TYPE.body };

/** The words of an inline run, with bold, italic and code kept. A link prints its text. */
function Inline({ nodes }: { nodes: readonly PhrasingContent[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.type) {
          case "text":
            return node.value;
          case "strong":
            return (
              <Text key={i} style={{ fontWeight: 600 }}>
                <Inline nodes={node.children} />
              </Text>
            );
          case "emphasis":
            return (
              <Text key={i} style={{ fontStyle: "italic" }}>
                <Inline nodes={node.children} />
              </Text>
            );
          case "inlineCode":
            return (
              <Text key={i} style={styles.tdMono}>
                {node.value}
              </Text>
            );
          case "link":
          case "delete":
            return <Inline key={i} nodes={node.children} />;
          case "break":
            return "\n";
          default:
            return null;
        }
      })}
    </>
  );
}

function Item({ item, mark }: { item: ListItem; mark: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 3 }} wrap={false}>
      <Text style={[styles.prose, { width: 14 }]}>{mark}</Text>
      <View style={{ flex: 1 }}>
        {item.children.map((child, i) => (
          <Block key={i} node={child} tight />
        ))}
      </View>
    </View>
  );
}

function Block({ node, tight = false }: { node: RootContent; tight?: boolean }) {
  switch (node.type) {
    case "heading":
      return (
        <Text
          style={{
            fontSize: HEADING_SIZE[node.depth] ?? TYPE.body,
            fontWeight: 600,
            color: BRAND.ink,
            marginTop: node.depth === 1 ? 0 : 12,
            marginBottom: 6,
          }}
          minPresenceAhead={40}
        >
          <Inline nodes={node.children} />
        </Text>
      );
    case "paragraph":
      return (
        <Text style={[styles.prose, { marginBottom: tight ? 0 : 6 }]}>
          <Inline nodes={node.children} />
        </Text>
      );
    case "list":
      return (
        <View style={{ marginBottom: 6 }}>
          {node.children.map((item, i) => (
            <Item
              key={i}
              item={item}
              mark={node.ordered ? `${(node.start ?? 1) + i}.` : "•"}
            />
          ))}
        </View>
      );
    case "blockquote":
      return (
        <View style={{ paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: BRAND.rule }}>
          {node.children.map((child, i) => (
            <Block key={i} node={child} />
          ))}
        </View>
      );
    case "code":
      return <Text style={[styles.tdMono, { marginBottom: 6 }]}>{node.value}</Text>;
    case "thematicBreak":
      return <View style={{ height: 1, backgroundColor: BRAND.rule, marginVertical: 8 }} />;
    case "table":
      return (
        <View style={{ marginBottom: 6 }}>
          {node.children.map((row, r) => (
            <View key={r} style={styles.tableRow}>
              {row.children.map((cell, c) => (
                <Text key={c} style={[styles.td, { flex: 1 }, r === 0 ? { fontWeight: 600 } : {}]}>
                  <Inline nodes={cell.children} />
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

/**
 * A document stored as Markdown, set in the PDF's type: headings, paragraphs, lists, tables.
 * `titled`: the page already prints the document's title, so its own top heading is left out.
 */
export function MarkdownBlocks({ source, titled = false }: { source: string; titled?: boolean }) {
  const { children } = unified().use(remarkParse).use(remarkGfm).parse(source);
  const [first, ...rest] = children;
  const blocks = titled && first?.type === "heading" && first.depth === 1 ? rest : children;
  return (
    <>
      {blocks.map((node, i) => (
        <Block key={i} node={node} />
      ))}
    </>
  );
}
