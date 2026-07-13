import  { useState, useEffect, useRef ,useCallback,useMemo} from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './TipTapEditor.css';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { BaseUrl } from '../App';
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import TableBlot from './TableBlot';

Quill.register(TableBlot);

const TipTapEditor = ({ show, onHide, mailTemplateData, setMailTemplateData, templateId, isSendMode, onSuccess }) => {
  const quillRef = useRef();

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📕',
      doc: '📘', docx: '📘',
      xls: '📗', xlsx: '📗', csv: '📗',
      ppt: '📙', pptx: '📙',
      zip: '🗜️', rar: '🗜️',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
      txt: '📝'
    };
    return icons[ext] || '📄';
  };

  const [users, setUsers] = useState([]);
  const [selectedToUsers, setSelectedToUsers] = useState([]);
  const [selectedCcUsers, setSelectedCcUsers] = useState([]);
  const [selectedBccUsers, setSelectedBccUsers] = useState([]);
  const [emailErrors, setEmailErrors] = useState({ to: '', cc: '', bcc: '' });
  const [submitErrors, setSubmitErrors] = useState({
    to: "",
    subject: "",
    body: "",
  });
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const validateBeforeSubmit = () => {
    let errors = { to: "", subject: "", body: "" };
    let isValid = true;

    if (selectedToUsers.length === 0) {
      errors.to = "Please select at least one recipient.";
      isValid = false;
    }

    if (!mailTemplateData.subject?.trim()) {
      errors.subject = "Subject is required.";
      isValid = false;
    }

    if (
      !mailTemplateData.body ||
      mailTemplateData.body.trim() === "" ||
      mailTemplateData.body === "<p><br></p>"
    ) {
      errors.body = "Email body is required.";
      isValid = false;
    }

    setSubmitErrors(errors);
    return isValid;
  };
  const insertTable = () => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    let tableHTML = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">';
    for (let i = 0; i < tableRows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < tableCols; j++) {
        if (i === 0) {
          tableHTML += '<th style="border: 1px solid #ddd; padding: 8px; min-width: 50px; font-weight: bold; background-color: #f2f2f2;">&nbsp;</th>';
        } else {
          tableHTML += '<td style="border: 1px solid #ddd; padding: 8px; min-width: 50px;">&nbsp;</td>';
        }
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</table>';
    
    const range = editor.getSelection(true);
    const position = range ? range.index : editor.getLength();
    editor.insertEmbed(position, 'table', tableHTML, 'user');
    editor.insertText(position + 1, '\n', 'user');
    editor.setSelection(position + 2, 0);
    
    setShowTableModal(false);
    setTableRows(3);
    setTableCols(3);
  };

   const modules = useMemo(() => ({
    toolbar: {
      container: [
        ['undo', 'redo'],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'header': [1, 2, 3, false] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        ['image'],
        ['table'],
        ['clean']
      ],
      handlers: {
        undo: () => quillRef.current?.getEditor().history.undo(),
        redo: () => quillRef.current?.getEditor().history.redo(),
        table: () => setShowTableModal(true)
      }
    },
    clipboard: {
      matchVisual: false,
      matchers: [
        ['table', (node, delta) => delta],
        ['tr', (node, delta) => delta],
        ['td', (node, delta) => delta],
        ['th', (node, delta) => delta]
      ]
    },
    history: {
      delay: 1000,
      maxStack: 50
    }
  }), []);

   const formats = useMemo(() => [
    'font', 'size', 'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'align', 'list', 'bullet', 'indent',
    'blockquote', 'code-block', 'image', 'table'
  ], []);

   const handleFieldChange = useCallback((field, value) => {
    setMailTemplateData(prev => ({...prev, [field]: value}));
    if (submitErrors[field]) {
      setSubmitErrors(prev => ({...prev, [field]: ''}));
    }
  }, [setMailTemplateData, submitErrors]);

  const resetForm = () => {
    setSelectedToUsers([]);
    setSelectedCcUsers([]);
    setSelectedBccUsers([]);
    setEmailErrors({ to: '', cc: '', bcc: '' });
    setSubmitErrors({ to: "", subject: "", body: "" });
    setMailTemplateData({ to: '', cc: '', bcc: '', subject: '', body: '' });
    setAttachments([]);
    if (quillRef.current?.getEditor()) {
      quillRef.current.getEditor().setContents([]);
    }
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  const handlePaste = useCallback(() => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      editor.root.addEventListener('paste', (e) => {
        const clipboardData = e.clipboardData;
        
        if (clipboardData && clipboardData.types.includes('text/html')) {
          const htmlData = clipboardData.getData('text/html');
          if (htmlData.includes('<table') || htmlData.includes('<tr') || htmlData.includes('<td')) {
            e.preventDefault();
            const range = editor.getSelection() || { index: 0, length: 0 };
            editor.clipboard.dangerouslyPasteHTML(range.index, htmlData);
            return;
          }
        }
        
        if (clipboardData && clipboardData.files.length > 0) {
          const file = clipboardData.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const range = editor.getSelection() || { index: 0, length: 0 };
              editor.insertEmbed(range.index, 'image', event.target.result);
            };
            reader.readAsDataURL(file);
            e.preventDefault();
          }
        }
      });
    }
  }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (email) => {
    return emailRegex.test(email);
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BaseUrl}api/auth/all-ba-users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    if (show) {
      fetchUsers();
    }
  }, [show]);

  useEffect(() => {
    if (mailTemplateData.to) {
      const toEmails = mailTemplateData.to.split(', ').filter(e => e.trim());
      setSelectedToUsers(toEmails.map(email => ({ value: email, label: email })));
    }
    if (mailTemplateData.cc) {
      const ccEmails = mailTemplateData.cc.split(', ').filter(e => e.trim());
      setSelectedCcUsers(ccEmails.map(email => ({ value: email, label: email })));
    }
    if (mailTemplateData.bcc) {
      const bccEmails = mailTemplateData.bcc.split(', ').filter(e => e.trim());
      setSelectedBccUsers(bccEmails.map(email => ({ value: email, label: email })));
    }
  }, [mailTemplateData.to, mailTemplateData.cc, mailTemplateData.bcc]);

  const userOptions = users.map(user => ({
    value: user.email,
    label: user.email,
    id: user.id
  }));

 const toEmails = selectedToUsers.map(u => u.value);
 const ccEmails = selectedCcUsers.map(u => u.value);
 const bccEmails = selectedBccUsers.map(u => u.value);
 
 const toOptions = userOptions.filter(
  u =>
    !ccEmails.includes(u.value) &&
    !bccEmails.includes(u.value)
 );

 const ccOptions = userOptions.filter(
  u =>
    !toEmails.includes(u.value) &&
    !bccEmails.includes(u.value)
 );

 const bccOptions = userOptions.filter(
  u =>
    !toEmails.includes(u.value) &&
    !ccEmails.includes(u.value)
 );

  const handleSubmit = async () => {
    if (!validateBeforeSubmit()) return;

    const payload = {
      to: selectedToUsers.map(u => u.value),
      cc: selectedCcUsers.map(u => u.value),
      bcc: selectedBccUsers.map(u => u.value),
      subject: mailTemplateData.subject,
      content: mailTemplateData.body,
    };

    setIsLoading(true);
    try {
      const url = templateId ? `${BaseUrl}api/manual-mail/${templateId}` : `${BaseUrl}api/manual-mail`;
      const method = templateId ? 'put' : 'post';
      
      await axios[method](url, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      
      if (onSuccess) {
        onSuccess(templateId ? 'Template updated successfully!' : 'Template created successfully!');
      }
      handleClose();
    } catch (error) {
      console.error('Error saving template:', error);
      if (onSuccess) {
        onSuccess('Error saving template', true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!validateBeforeSubmit()) return;

    const formData = new FormData();
    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    setIsLoading(true);
    try {
      await axios.post(`${BaseUrl}api/manual-mail/${templateId}/send`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (onSuccess) {
        onSuccess('Email sent successfully!');
      }
      handleClose();
    } catch (error) {
      console.error('Error sending email:', error);
      if (onSuccess) {
        onSuccess('Error sending email', true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSelection = (fieldType) => (selectedOptions, actionMeta) => {
    const setters = {
      to: setSelectedToUsers,
      cc: setSelectedCcUsers,
      bcc: setSelectedBccUsers
    };
    
    const otherFields = {
      to: [...ccEmails, ...bccEmails],
      cc: [...toEmails, ...bccEmails],
      bcc: [...toEmails, ...ccEmails]
    };

    if (actionMeta.action === 'create-option') {
      const newEmail = actionMeta.option.value;
      if (!validateEmail(newEmail)) {
        setEmailErrors(prev => ({ ...prev, [fieldType]: 'Please enter a valid email address' }));
        return;
      }
      if (otherFields[fieldType].includes(newEmail)) {
        const otherFieldNames = fieldType === 'to' ? 'CC or BCC' : fieldType === 'cc' ? 'To or BCC' : 'To or CC';
        setEmailErrors(prev => ({ ...prev, [fieldType]: `This email is already selected in ${otherFieldNames}` }));
        return;
      }
    }
    
    setEmailErrors(prev => ({ ...prev, [fieldType]: '' }));
    if (submitErrors[fieldType]) {
      setSubmitErrors(prev => ({...prev, [fieldType]: ''}));
    }
    setters[fieldType](selectedOptions || []);
    const emails = selectedOptions ? selectedOptions.map(option => option.value).join(', ') : '';
    setMailTemplateData(prev => ({...prev, [fieldType]: emails}));
  };

  return (
    <>
      <Modal show={showTableModal} onHide={() => setShowTableModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Insert Table</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Rows</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="20"
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Columns</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="10"
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTableModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={insertTable}>
            Insert
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal size="lg" show={show} onHide={handleClose} centered className="mail-template-modal">
        <Modal.Header closeButton>
          <Modal.Title>{templateId ? 'Edit Mail Template' : 'Create Mail Template'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={12} className="form_margin">
                <Form.Label className="txt_lable form-label">To</Form.Label>
                <CreatableSelect
                  isMulti
                   closeMenuOnSelect={false} 
                  options={toOptions}
                  value={selectedToUsers}
                  onChange={handleEmailSelection('to')}
                  placeholder="Select recipients"
                  className="basic-multi-select"
                  classNamePrefix="select"
                  isDisabled={isSendMode}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '38px',
                      border: emailErrors.to ? '1px solid #dc3545' : '1px solid #ced4da',
                      borderRadius: '0.375rem'
                    })
                  }}
                />
                {emailErrors.to && (
                  <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {emailErrors.to}
                  </div>
                )}
                 {submitErrors.to && (
                  <div style={{ color: "#dc3545", fontSize: "0.875rem" }}>
                    {submitErrors.to}
                  </div>
                )}
              </Col>
            </Row>
            <Row>
              <Col md={6} className="form_margin">
                <Form.Label className="txt_lable form-label">CC</Form.Label>
                <CreatableSelect
                  isMulti
                   closeMenuOnSelect={false} 
                  options={ccOptions}
                  value={selectedCcUsers}
                  onChange={handleEmailSelection('cc')}
                  placeholder="Select CC recipients"
                  className="basic-multi-select"
                  classNamePrefix="select"
                  isDisabled={isSendMode}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '38px',
                      border: emailErrors.cc ? '1px solid #dc3545' : '1px solid #ced4da',
                      borderRadius: '0.375rem'
                    })
                  }}
                />
                {emailErrors.cc && (
                  <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {emailErrors.cc}
                  </div>
                )}
              </Col>
              <Col md={6} className="form_margin">
                <Form.Label className="txt_lable form-label">BCC</Form.Label>
                <CreatableSelect
                  isMulti
                   closeMenuOnSelect={false} 
                  options={bccOptions}
                  value={selectedBccUsers}
                  onChange={handleEmailSelection('bcc')}
                  placeholder="Select BCC recipients"
                  className="basic-multi-select"
                  classNamePrefix="select"
                  isDisabled={isSendMode}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '38px',
                      border: emailErrors.bcc ? '1px solid #dc3545' : '1px solid #ced4da',
                      borderRadius: '0.375rem'
                    })
                  }}
                />
                {emailErrors.bcc && (
                  <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {emailErrors.bcc}
                  </div>
                )}
              </Col>
            </Row>
            <Row>
              <Col md={12} className="form_margin">
                <Form.Label className="txt_lable form-label">Subject</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter email subject"
                  value={mailTemplateData.subject || ''}
                  onChange={(e) => handleFieldChange('subject', e.target.value)}
                  readOnly={isSendMode}
                />
                {submitErrors.subject && (
                  <div style={{ color: "#dc3545", fontSize: "0.875rem" }}>
                    {submitErrors.subject}
                  </div>
                )}
              </Col>
            </Row>
            <Row>
              <Col md={12} className="form_margin" style={{ marginBottom: templateId ? '15px' : '45px' }}>
                <Form.Label className="txt_lable form-label">Body</Form.Label>
                <div style={{ height: '250px' }}>
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={mailTemplateData.body || ''}
                    onChange={(content) => handleFieldChange('body', content)}
                    onFocus={handlePaste}
                    modules={modules}
                    formats={formats}
                    placeholder="Enter email body content"
                    style={{ height: '200px' }}
                    readOnly={isSendMode}
                  />
                </div>
              </Col>
                 {submitErrors.body && (
                  <div style={{ color: "#dc3545", fontSize: "0.875rem",marginBottom :"10px" }}>
                    {submitErrors.body}
                  </div>
                )}
            </Row>
            {isSendMode && (
              <Row style={{ marginTop: '-20px' }}>
                <Col md={12} className="form_margin">
                  <Form.Label className="txt_lable form-label">Attachments</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    onChange={(e) => {
                      setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
                      e.target.value = '';
                    }}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload" 
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ced4da',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#495057',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  >
                    📎 Choose Files
                  </label>
                  {attachments.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {attachments.map((file, index) => (
                        <div 
                          key={index} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '0.375rem'
                          }}
                        >
                          <span 
                            style={{ 
                              fontSize: '0.875rem',
                              color: '#495057',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              marginRight: '8px'
                            }}
                            title={file.name}
                          >
                            {getFileIcon(file.name)} {file.name}
                          </span>
                          <Button 
                            variant="link" 
                            size="sm" 
                            style={{ 
                              padding: '0 4px', 
                              color: '#dc3545', 
                              textDecoration: 'none',
                              fontSize: '1.2rem',
                              lineHeight: 1,
                              minWidth: 'auto'
                            }}
                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Col>
              </Row>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-end w-100" style={{gap: '8px'}}>
            <Button className="btn_cancel px-3" onClick={handleClose}>
              Cancel
            </Button>
            {isSendMode ? (
              <Button className="btn_sub" onClick={handleSend} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            ) : (
              <>
                <Button className="btn_sub" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (templateId ? 'Updating...' : 'Saving...') : (templateId ? "Update" : "Save Template")}
                </Button>
              </>
            )}
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TipTapEditor;
 