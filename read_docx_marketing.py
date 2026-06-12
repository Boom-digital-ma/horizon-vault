import zipfile
import xml.etree.ElementTree as ET

def get_docx_text(path):
    ns = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
    paragraph_tag = ns + 'p'
    text_tag = ns + 't'
    
    paragraphs = []
    with zipfile.ZipFile(path) as docx:
        xml_content = docx.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        for p in root.iter(paragraph_tag):
            texts = [node.text for node in p.iter(text_tag) if node.text]
            if texts:
                paragraphs.append("".join(texts))
            else:
                paragraphs.append("")
    return "\n".join(paragraphs)

path = "/Users/nabil/Documents/Sites/mawarif/docs/Page Strate\u0301gie Marketing MawaRif.docx"
text = get_docx_text(path)
print(text[:20000])
