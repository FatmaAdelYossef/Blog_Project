import React, { useEffect, useState } from 'react';
import { categoryService } from '../../services/categoryService';
import { jwtService } from '../../services/jwtService';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        checkAuth();
        fetchCategories();
    }, []);

    const checkAuth = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                if (!jwtService.isTokenExpired(token)) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                setIsAuthenticated(false);
            }
        } else {
            setIsAuthenticated(false);
        }
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryService.getAll();
            const list = Array.isArray(data) ? data : (data.items || data.data || []);
            setCategories(list);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to fetch categories.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setSaving(true);
            setError('');

            if (editingId) {
                await categoryService.update(editingId, { name });
            } else {
                await categoryService.create({ name });
            }

            setName('');
            setEditingId(null);
            fetchCategories();
        } catch (err) {
            console.error('Error saving category:', err.response?.data || err.message);
            setError('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setName(cat.name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setName('');
    };

    const handleDelete = async (id) => {
        try {
            await categoryService.delete(id);
            fetchCategories();
        } catch (err) {
            console.error('Error deleting category:', err);
            setError(err.response?.data?.message || 'Failed to delete category. It may have associated posts.');
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '30px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            
            <h2 style={{ marginTop: '0', marginBottom: '20px', color: '#333' }}>Manage Categories</h2>

            {error && <div style={{ background: '#f8d7da', color: '#842029', padding: '10px 15px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

            {isAuthenticated && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #eaeaea' }}>
                    <input 
                        type="text" 
                        placeholder="New category name..." 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '15px', outline: 'none' }}
                    />
                    <button 
                        type="submit" 
                        disabled={saving}
                        style={{ background: editingId ? '#ffc107' : '#0d6efd', color: editingId ? '#000' : '#fff', border: 'none', padding: '0 25px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
                    >
                        {saving ? 'Saving...' : (editingId ? 'Update' : 'Add')}
                    </button>
                    {editingId && (
                        <button 
                            type="button" 
                            onClick={handleCancelEdit}
                            style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}
                        >
                            Cancel
                        </button>
                    )}
                </form>
            )}

            {loading ? (
                <p style={{ textAlign: 'center', color: '#666' }}>Loading categories...</p>
            ) : categories.length > 0 ? (
                <div style={{ border: '1px solid #eaeaea', borderRadius: '8px', overflow: 'hidden' }}>
                    {categories.map((cat, index) => (
                        <div 
                            key={cat.id} 
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '15px 20px', 
                                borderBottom: index !== categories.length - 1 ? '1px solid #eaeaea' : 'none',
                                background: index % 2 === 0 ? '#fff' : '#fcfcfc'
                            }}
                        >
                            <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{cat.name}</span>
                            {isAuthenticated && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        onClick={() => handleEdit(cat)}
                                        style={{ background: '#ffc107', color: '#000', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(cat.id)}
                                        style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p style={{ textAlign: 'center', color: '#888', padding: '20px 0' }}>No categories added yet.</p>
            )}

        </div>
    );
}