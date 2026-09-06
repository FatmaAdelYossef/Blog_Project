import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { postService } from '../../services/postService';
import { uploadService } from '../../services/uploadService';
import { categoryService } from '../../services/categoryService'; 
import { jwtService } from '../../services/jwtService'; 

export default function PostDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    // State للتحقق هل المستخدم مسجل دخول أم لا
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'Image' | 'Music' | 'Link'

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    
    // State خاصة بالـ Category للبوست والقائمة الخاصة بها
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    
    const [newFiles, setNewFiles] = useState([]);
    const [newTextUrl, setNewTextUrl] = useState('');
    
    const [editingMediaId, setEditingMediaId] = useState(null);
    const [editTextUrl, setEditTextUrl] = useState('');

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // التحقق من حالة تسجيل الدخول
        const token = localStorage.getItem('token');
        if (token) {
            try {
                if (!jwtService.isTokenExpired(token)) {
                    setIsAuthenticated(true);
                }
            } catch (e) {
                setIsAuthenticated(false);
            }
        }

        fetchPostDetails();
        fetchCategories(); // جلب الكاتيجوريز عند تحميل الصفحة
    }, [id]);

    const fetchPostDetails = async () => {
        try {
            setLoading(true);
            const response = await postService.getPostById(id);
            const postData = response.data || response;
            setPost(postData);
            setTitle(postData.title);
            setContent(postData.content);
            // ضبط قيمة الـ categoryId الحالية للبوست
            setCategoryId(postData.categoryId || '');
        } catch (error) {
            console.error('Error fetching post details:', error);
        } finally {
            setLoading(false);
        }
    };

    // دالة لجلب الكاتيجوريز للقائمة المنسدلة
    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAll();
            const data = response.data || response;
            setCategories(Array.isArray(data) ? data : data.items || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleUpdatePost = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return;
        try {
            setSaving(true);
            if (!title.trim() || !content.trim()) {
                setSaving(false);
                return;
            }

            // إرسال الـ categoryId مع البيانات المحدثة
            const updateData = { 
                title, 
                content, 
                categoryId: categoryId ? Number(categoryId) : null 
            };
            
            await postService.updatePost(id, updateData);

            setIsEditing(false);
            fetchPostDetails();
        } catch (error) {
            console.error('Error updating post:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleAddNewMedia = async () => {
        if (!isAuthenticated) return;
        try {
            setSaving(true);

            if (activeTab === 'Image' && newFiles.length > 0) {
                for (let i = 0; i < newFiles.length; i++) {
                    const file = newFiles[i];
                    const uploadedFileName = await uploadService.uploadImage(file);
                    await postService.addMediaToPost(id, {
                        url: uploadedFileName,
                        mediaType: 'Image'
                    });
                }
                setNewFiles([]);
            } else if ((activeTab === 'Music' || activeTab === 'Link') && newTextUrl.trim()) {
                await postService.addMediaToPost(id, {
                    url: newTextUrl.trim(),
                    mediaType: activeTab
                });
                setNewTextUrl('');
            }

            fetchPostDetails();
        } catch (error) {
            console.error('Error adding media:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMediaItem = async (mediaId) => {
        if (!isAuthenticated) return;
        try {
            setSaving(true);
            await postService.deleteMedia(mediaId);
            fetchPostDetails();
        } catch (error) {
            console.error('Error deleting media:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateMediaItem = async (mediaId) => {
        if (!isAuthenticated) return;
        if (!editTextUrl.trim()) return;
        try {
            setSaving(true);
            await postService.updateMediaToPost(mediaId, {
                url: editTextUrl.trim(),
                mediaType: activeTab
            });
            setEditingMediaId(null);
            setEditTextUrl('');
            fetchPostDetails();
        } catch (error) {
            console.error('Error updating media:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: '#666', fontSize: '18px' }}>Loading post details...</div>;
    if (!post) return <div style={{ textAlign: 'center', padding: '100px', color: '#666', fontSize: '18px' }}>Post not found.</div>;

    const currentTabMedias = activeTab === 'details' 
        ? [] 
        : (post.medias?.filter(m => m.mediaType === activeTab) || []);

    return (
        <div style={{ width: '100%', minHeight: '100vh', margin: '0', padding: '30px', boxSizing: 'border-box', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%' }}>
                <button 
                    onClick={() => navigate(-1)}
                    style={{ background: '#fff', color: '#333', border: '1px solid #ced4da', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                >
                    ← Back
                </button>

                {isAuthenticated && !isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 2px 4px rgba(13, 110, 253, 0.2)' }}
                    >
                        Edit Post
                    </button>
                )}
            </div>

            {/* Main Full Width Card */}
            <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #eaeaea', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* Tabs Header */}
                <div style={{ display: 'flex', borderBottom: '2px solid #eaeaea', marginBottom: '30px', gap: '20px' }}>
                    {[
                        { id: 'details', label: 'Details' },
                        { id: 'Image', label: 'Images' },
                        { id: 'Music', label: 'Music' },
                        { id: 'Link', label: 'Links' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab.id);
                                setNewFiles([]);
                                setNewTextUrl('');
                                setEditingMediaId(null);
                            }}
                            style={{
                                padding: '12px 24px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '3px solid #0d6efd' : '3px solid transparent',
                                marginBottom: '-2px',
                                color: activeTab === tab.id ? '#0d6efd' : '#666',
                                fontWeight: activeTab === tab.id ? '700' : '500',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {!isEditing || !isAuthenticated ? (
                    <div style={{ flex: 1 }}>
                        {activeTab === 'details' ? (
                            <div>
                                <h1 style={{ marginTop: '0', color: '#1a1a1a', fontSize: '32px', marginBottom: '15px' }}>{post.title}</h1>
                                <div style={{ color: '#888', fontSize: '14px', marginBottom: '25px' }}>
                                    Published on {new Date(post.createdAt).toLocaleDateString()} 
                                    {post.categoryName && ` • Category: ${post.categoryName}`}
                                </div>
                                <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '30px' }} />
                                <div 
                                    dangerouslySetInnerHTML={{ __html: post.content }} 
                                    style={{ lineHeight: '1.8', color: '#333', fontSize: '16px' }}
                                />
                            </div>
                        ) : (
                            <div>
                                <h3 style={{ fontSize: '20px', color: '#333', marginBottom: '20px' }}>{activeTab} Items</h3>
                                {currentTabMedias.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                                        {currentTabMedias.map((media, index) => (
                                            <div key={media.id || index} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #eaeaea', background: '#f9f9f9', padding: '15px' }}>
                                                {activeTab === 'Image' ? (
                                                    <img src={media.url} alt="media" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '6px', display: 'block' }} />
                                                ) : (
                                                    <a href={media.url} target="_blank" rel="noreferrer" style={{ color: '#0d6efd', wordBreak: 'break-all', fontSize: '15px', textDecoration: 'none' }}>
                                                        🔗 {media.url}
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#888', fontSize: '16px' }}>No {activeTab.toLowerCase()} attached.</p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ================= EDIT MODE ================= */
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        
                        <div>
                            {activeTab === 'details' ? (
                                <form onSubmit={handleUpdatePost}>
                                    <h2 style={{ marginTop: '0', marginBottom: '25px', color: '#1a1a1a', fontSize: '22px' }}>Edit Title, Content & Category</h2>
                                    
                                    {/* حقل التعديل: العنوان */}
                                    <div style={{ marginBottom: '25px' }}>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#444', fontSize: '15px' }}>Title</label>
                                        <input 
                                            type="text" 
                                            value={title} 
                                            onChange={(e) => setTitle(e.target.value)} 
                                            style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '16px', outline: 'none' }}
                                        />
                                    </div>

                                    {/* حقل التعديل: اختيار الفئة (Category Dropdown) */}
                                    <div style={{ marginBottom: '25px' }}>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#444', fontSize: '15px' }}>Category</label>
                                        <select
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                            style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '16px', outline: 'none', background: '#fff', cursor: 'pointer' }}
                                        >
                                            <option value="">Select Category (اختر الفئة)</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* حقل التعديل: المحتوى */}
                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#444', fontSize: '15px' }}>Content</label>
                                        <div style={{ marginBottom: '50px' }}>
                                            <ReactQuill 
                                                theme="snow" 
                                                value={content} 
                                                onChange={setContent} 
                                                style={{ background: '#fff', borderRadius: '8px', height: '250px' }}
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={saving}
                                        style={{ background: '#198754', color: '#fff', padding: '12px 30px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '16px' }}
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </form>
                            ) : (
                                <div>
                                    <h2 style={{ marginTop: '0', marginBottom: '25px', color: '#1a1a1a', fontSize: '22px' }}>Manage {activeTab}</h2>
                                    
                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#444', fontSize: '15px' }}>Current {activeTab}</label>
                                        {post.medias && post.medias.filter(m => m.mediaType === activeTab).length > 0 ? (
                                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                                {post.medias.map((media) => {
                                                    if (media.mediaType !== activeTab) return null;
                                                    return (
                                                        <div key={media.id} style={{ border: '1px solid #eaeaea', borderRadius: '10px', overflow: 'hidden', background: '#fafafa', width: activeTab === 'Image' ? '180px' : '280px', padding: '10px' }}>
                                                            {activeTab === 'Image' ? (
                                                                <img src={media.url} alt="media" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', display: 'block', marginBottom: '8px' }} />
                                                            ) : (
                                                                <div>
                                                                    {editingMediaId === media.id ? (
                                                                        <div style={{ marginBottom: '8px' }}>
                                                                            <input 
                                                                                type="text" 
                                                                                value={editTextUrl} 
                                                                                onChange={(e) => setEditTextUrl(e.target.value)}
                                                                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '6px', fontSize: '13px' }}
                                                                            />
                                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                                <button onClick={() => handleUpdateMediaItem(media.id)} style={{ background: '#198754', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Update</button>
                                                                                <button onClick={() => setEditingMediaId(null)} style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <p style={{ fontSize: '13px', wordBreak: 'break-all', margin: '0 0 8px 0', color: '#333' }}>{media.url}</p>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {activeTab !== 'Image' && editingMediaId !== media.id && (
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => { setEditingMediaId(media.id); setEditTextUrl(media.url); }}
                                                                    style={{ background: '#ffc107', color: '#000', border: 'none', width: '100%', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginBottom: '5px' }}
                                                                >
                                                                    Edit URL
                                                                </button>
                                                            )}

                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleDeleteMediaItem(media.id)}
                                                                style={{ background: '#dc3545', color: '#fff', border: 'none', width: '100%', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p style={{ color: '#888', fontSize: '15px', margin: '0' }}>No {activeTab.toLowerCase()} attached.</p>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#444', fontSize: '15px' }}>
                                            Add New {activeTab} {activeTab === 'Image' ? '(Upload File)' : '(String URL)'}
                                        </label>
                                        
                                        {activeTab === 'Image' ? (
                                            <div>
                                                <div style={{ border: '2px dashed #ced4da', padding: '30px', borderRadius: '10px', textAlign: 'center', background: '#f8f9fa', marginBottom: '15px' }}>
                                                    <input 
                                                        type="file" 
                                                        multiple 
                                                        onChange={(e) => setNewFiles(e.target.files)} 
                                                        style={{ fontSize: '15px' }}
                                                    />
                                                </div>
                                                {newFiles.length > 0 && (
                                                    <button 
                                                        type="button"
                                                        onClick={handleAddNewMedia}
                                                        disabled={saving}
                                                        style={{ background: '#198754', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                                    >
                                                        {saving ? 'Uploading...' : 'Upload & Add Images'}
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input 
                                                    type="text" 
                                                    placeholder={`Enter ${activeTab} URL...`}
                                                    value={newTextUrl}
                                                    onChange={(e) => setNewTextUrl(e.target.value)}
                                                    style={{ flex: 1, padding: '12px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', outline: 'none' }}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={handleAddNewMedia}
                                                    disabled={saving}
                                                    style={{ background: '#198754', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                                >
                                                    {saving ? 'Adding...' : 'Add'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid #eaeaea', paddingTop: '25px', marginTop: '20px' }}>
                            <button 
                                type="button" 
                                onClick={() => setIsEditing(false)}
                                style={{ background: '#6c757d', color: '#fff', padding: '12px 30px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '16px' }}
                            >
                                Close Edit Mode
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}