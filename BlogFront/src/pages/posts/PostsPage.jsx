import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { postService } from '../../services/postService';
import { categoryService } from '../../services/categoryService';
import { jwtService } from '../../services/jwtService';

export default function PostsPage() {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // فلاتر البحث والكاتيجورى
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
    const [searchTitle, setSearchTitle] = useState('');

    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newCategoryId, setNewCategoryId] = useState('');
    const [saving, setSaving] = useState(false);

    const navigate = useNavigate();

    const checkAuth = () => {
        const token = localStorage.getItem('token');
        if (!token) return false;
        try {
            return !jwtService.isTokenExpired(token);
        } catch (e) {
            return false;
        }
    };

    const isAuthenticated = checkAuth();

    useEffect(() => {
        fetchCategories();
    }, []);

    // جلب البوستات عند تغيير رقم الصفحة أو تغيير الكاتيجورى من الـ DDL
    useEffect(() => {
        fetchPosts(pageNumber, selectedCategoryFilter, searchTitle);
    }, [pageNumber, selectedCategoryFilter]);


    const fetchPosts = async (page, categoryId, title) => {
        try {
            setLoading(true);

            // تمرير القيم بشكل مفرد تماماً كما ينتظرها الـ service لديك
            const response = await postService.getAllPosts(
                page,                               // pageNumber
                pageSize,                           // pageSize
                categoryId ? Number(categoryId) : '', // categoryId
                title && title.trim() ? title.trim() : '' // title
            );

            const responseData = response.data || response;
            const rawItems = responseData?.items;

            if (Array.isArray(rawItems)) {
                const postsWithoutMedia = rawItems.map(({ medias, ...rest }) => rest);
                setPosts(postsWithoutMedia);
                setTotalPages(responseData.totalPages || 1);
            } else {
                setPosts([]);
                setTotalPages(responseData?.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAll();
            const categoriesData = response.data || response;
            if (Array.isArray(categoriesData)) {
                setCategories(categoriesData);
                if (categoriesData.length > 0) {
                    setNewCategoryId(categoriesData[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPageNumber(1);
        fetchPosts(1, selectedCategoryFilter, searchTitle);
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return;
        if (!newTitle.trim() || !newContent.trim() || !newCategoryId) return;

        try {
            setSaving(true);
            await postService.createPost({
                title: newTitle.trim(),
                content: newContent.trim(),
                categoryId: Number(newCategoryId)
            });

            setNewTitle('');
            setNewContent('');
            if (categories.length > 0) setNewCategoryId(categories[0].id);
            setIsAddModalOpen(false);
            setPageNumber(1);
            fetchPosts(1, selectedCategoryFilter, searchTitle);
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDelete = async (id) => {
        if (!isAuthenticated) return;
        try {
            await postService.deletePost(id);
            setDeleteConfirmId(null);
            fetchPosts(pageNumber, selectedCategoryFilter, searchTitle);
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    if (loading && posts.length === 0) return <div style={{ textAlign: 'center', padding: '100px', color: '#666', fontSize: '18px', fontFamily: 'sans-serif' }}>Loading posts...</div>;

    return (
        <div style={{ maxWidth: '100%', padding: '0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', minHeight: '85vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>

            {/* Upper Content */}
            <div>
                {/* الصف الأول: العنوان وزر الإضافة (معزول تماماً عن الفلاتر) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: '0', color: '#1a1a1a', fontSize: '26px', fontWeight: '700' }}>All Posts</h2>

                    {isAuthenticated && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 4px rgba(13, 110, 253, 0.2)' }}
                        >
                            + Add New Post
                        </button>
                    )}
                </div>

                {/* الصف الثاني: شريط البحث وفلتر الكاتيجورى (Dropdown) فى شريط منفصل ومنظم */}
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eaeaea', marginBottom: '25px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>

                    {/* فلتر الكاتيجورى (DDL) */}
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <select
                            value={selectedCategoryFilter}
                            onChange={(e) => {
                                const categoryId = e.target.value;
                                console.log("Selected Category ID:", categoryId);
                                setSelectedCategoryFilter(categoryId);
                                setPageNumber(1);
                            }}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px', outline: 'none', background: '#fff', cursor: 'pointer' }}
                        >
                            <option value="">All Categories (كل الفئات)</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* خانة وزر البحث بالـ Title */}
                    <form onSubmit={handleSearchSubmit} style={{ flex: '2', display: 'flex', gap: '10px', minWidth: '250px', margin: 0 }}>
                        <input
                            type="text"
                            placeholder="Search posts by title..."
                            value={searchTitle}
                            onChange={(e) => setSearchTitle(e.target.value)}
                            style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '14px', outline: 'none', background: '#fff' }}
                        />
                        <button
                            type="submit"
                            style={{ background: '#495057', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                        >
                            Search
                        </button>
                    </form>
                </div>

                {posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '12px', border: '1px solid #eaeaea', color: '#666' }}>
                        No posts found.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                        {posts.map(post => (
                            <div key={post.id} style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 10px 0', color: '#1a1a1a', fontSize: '18px', fontWeight: '600' }}>{post.title}</h3>

                                    <div
                                        dangerouslySetInnerHTML={{ __html: post.content ? (post.content.substring(0, 90) + '...') : '' }}
                                        style={{ color: '#555', fontSize: '14px', marginBottom: '15px', lineHeight: '1.5' }}
                                    />
                                </div>

                                <div>
                                    <div style={{ color: '#888', fontSize: '12px', marginBottom: '15px' }}>
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </div>

                                    {deleteConfirmId === post.id ? (
                                        <div style={{ background: '#fff8e6', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ffeeba' }}>
                                            <p style={{ fontSize: '13px', margin: '0 0 10px 0', color: '#856404', fontWeight: '500' }}>Delete this post?</p>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleConfirmDelete(post.id)}
                                                    style={{ flex: 1, background: '#dc3545', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(null)}
                                                    style={{ flex: 1, background: '#6c757d', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => navigate(`/posts/${post.id}`)}
                                                style={{ flex: 1, background: '#0d6efd', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                            >
                                                View Details
                                            </button>

                                            {isAuthenticated && (
                                                <button
                                                    onClick={() => setDeleteConfirmId(post.id)}
                                                    style={{ background: '#fff', color: '#dc3545', border: '1px solid #dc3545', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {posts.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '40px', paddingBottom: '20px', borderTop: '1px solid #eaeaea', paddingTop: '20px' }}>
                    <button
                        disabled={pageNumber === 1}
                        onClick={() => setPageNumber(prev => prev - 1)}
                        style={{ padding: '8px 16px', background: pageNumber === 1 ? '#f1f1f1' : '#fff', color: pageNumber === 1 ? '#aaa' : '#333', border: '1px solid #ced4da', borderRadius: '8px', cursor: pageNumber === 1 ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '14px' }}
                    >
                        Previous
                    </button>

                    <span style={{ fontWeight: '600', color: '#444', fontSize: '14px' }}>
                        Page {pageNumber} of {totalPages}
                    </span>

                    <button
                        disabled={pageNumber >= totalPages}
                        onClick={() => setPageNumber(prev => prev + 1)}
                        style={{ padding: '8px 16px', background: pageNumber >= totalPages ? '#f1f1f1' : '#fff', color: pageNumber >= totalPages ? '#aaa' : '#333', border: '1px solid #ced4da', borderRadius: '8px', cursor: pageNumber >= totalPages ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '14px' }}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Modal إضافة بوست جديد */}
            {isAddModalOpen && isAuthenticated && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', color: '#1a1a1a', fontWeight: '700' }}>Create New Post</h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreatePost}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444', fontSize: '14px' }}>Category</label>
                                <select
                                    value={newCategoryId}
                                    onChange={(e) => setNewCategoryId(e.target.value)}
                                    style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', outline: 'none', background: '#fff' }}
                                    required
                                >
                                    <option value="" disabled>Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444', fontSize: '14px' }}>Title</label>
                                <input
                                    type="text"
                                    placeholder="Enter post title..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', outline: 'none' }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '40px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444', fontSize: '14px' }}>Content</label>
                                <div style={{ height: '220px', marginBottom: '10px' }}>
                                    <ReactQuill
                                        theme="snow"
                                        value={newContent}
                                        onChange={setNewContent}
                                        style={{ background: '#fff', borderRadius: '8px', height: '170px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #eaeaea', paddingTop: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{ background: '#198754', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                                >
                                    {saving ? 'Creating...' : 'Create Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}