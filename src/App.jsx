import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Search, Plus, Trash2, Edit2, Check, X, Loader2, StickyNote, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Palette,
  Sun, Moon, Download
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/notes';

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark'); // Default to dark for premium feel

  const editorRef = useRef(null);
  const editEditorRef = useRef(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const fetchNotes = async () => {
    try {
      const response = await axios.get(API_URL);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editingId) {
      setEditContent(editEditorRef.current.innerHTML);
    } else {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentContent = editorRef.current.innerHTML;
    if (!title.trim() && !currentContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await axios.post(API_URL, { 
        title: title || 'Untitled', 
        content: currentContent 
      });
      setNotes([response.data, ...notes]);
      setTitle('');
      setContent('');
      editorRef.current.innerHTML = '';
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNote = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setNotes(notes.filter(note => note._id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const startEditing = (note) => {
    setEditingId(note._id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setTimeout(() => {
      if (editEditorRef.current) {
        editEditorRef.current.innerHTML = note.content;
      }
    }, 0);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  const saveEdit = async (id) => {
    const updatedContent = editEditorRef.current.innerHTML;
    try {
      const response = await axios.put(`${API_URL}/${id}`, {
        title: editTitle,
        content: updatedContent
      });
      setNotes(notes.map(note => note._id === id ? response.data : note));
      setEditingId(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const downloadNote = (note) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${note.title}</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          h1 { border-bottom: 1px solid #eee; padding-bottom: 10px; }
          .content { margin-top: 20px; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>${note.title}</h1>
        <div class="content">${note.content}</div>
      </body>
      </html>
    `;
    
    const element = document.createElement("a");
    const file = new Blob([htmlContent], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Toolbar = () => (
    <div className="toolbar">
      <button className="toolbar-btn" onClick={() => handleCommand('bold')} title="Bold"><Bold size={15} /></button>
      <button className="toolbar-btn" onClick={() => handleCommand('italic')} title="Italic"><Italic size={15} /></button>
      <button className="toolbar-btn" onClick={() => handleCommand('underline')} title="Underline"><Underline size={15} /></button>
      <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }}></div>
      <button className="toolbar-btn" onClick={() => handleCommand('justifyLeft')} title="Align Left"><AlignLeft size={15} /></button>
      <button className="toolbar-btn" onClick={() => handleCommand('justifyCenter')} title="Align Center"><AlignCenter size={15} /></button>
      <button className="toolbar-btn" onClick={() => handleCommand('justifyRight')} title="Align Right"><AlignRight size={15} /></button>
      <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }}></div>
      <div className="toolbar-btn" style={{ position: 'relative' }}>
        <Palette size={15} />
        <input 
          type="color" 
          className="color-picker" 
          style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          onChange={(e) => handleCommand('foreColor', e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <div className="container">
      <header>
        <div>
          <h1>Notes</h1>
          <p style={{ color: 'var(--text-muted)' }}>Made by Fahreza Arsya Maulana - 2406450365</p>
        </div>
        <button className="action-btn" onClick={toggleTheme} title="Toggle Theme" style={{ padding: '0.6rem', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </header>

      <div className="search-container">
        <Search className="search-icon" size={16} />
        <input
          type="text"
          className="search-input"
          placeholder="Filter notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="note-input-section">
        <Toolbar />
        <input
          type="text"
          className="title-input"
          placeholder="New note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div 
          ref={editorRef}
          className="rich-content-editor"
          contentEditable
          onInput={(e) => setContent(e.target.innerHTML)}
          data-placeholder="Start typing..."
        ></div>
        <div className="input-footer">
          <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
            <span>Add Note</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={24} color="var(--text-muted)" />
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
              <StickyNote size={32} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{searchQuery ? 'No matches found.' : 'Your workspace is empty.'}</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div key={note._id} className="note-card">
                {editingId === note._id ? (
                  <div className="edit-container">
                    <Toolbar />
                    <input
                      type="text"
                      className="title-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                    />
                    <div 
                      ref={editEditorRef}
                      className="rich-content-editor"
                      contentEditable
                      onInput={(e) => setEditContent(e.target.innerHTML)}
                    ></div>
                    <div className="input-footer">
                      <button onClick={cancelEditing} className="btn btn-ghost">
                        <X size={14} />
                        <span>Cancel</span>
                      </button>
                      <button onClick={() => saveEdit(note._id)} className="btn btn-primary">
                        <Check size={14} />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3>{note.title}</h3>
                    <div 
                      className="note-content"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    ></div>
                    <div className="note-card-footer">
                      <span className="note-date">
                        {new Date(note.createdAt).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <div className="card-actions">
                        <button 
                          className="action-btn" 
                          onClick={() => downloadNote(note)}
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button 
                          className="action-btn" 
                          onClick={() => startEditing(note)}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => deleteNote(note._id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;
