import { Quill } from 'react-quill';

const BlockEmbed = Quill.import('blots/block/embed');

class TableBlot extends BlockEmbed {
  static create(value) {
    const node = super.create();
    node.innerHTML = value;
    node.contentEditable = 'false';
    
    const cells = node.querySelectorAll('td, th');
    cells.forEach(cell => {
      cell.contentEditable = 'true';
      cell.style.outline = 'none';
    });
    
    return node;
  }

  static value(node) {
    return node.innerHTML;
  }
}

TableBlot.blotName = 'table';
TableBlot.tagName = 'div';
TableBlot.className = 'ql-table-wrapper';

export default TableBlot;
