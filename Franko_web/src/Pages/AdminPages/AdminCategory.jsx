import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, addCategory, updateCategory } from '../../Redux/Slice/categorySlice';
import { Modal, Spin, Button, Input, Table, Pagination } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

const AdminCategory = () => {
    const dispatch = useDispatch();
    const { categories = [], loading, error } = useSelector((state) => state.categories);


    const [isModalVisible, setIsModalVisible] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categoriesPerPage = 6;

    useEffect(() => {
        if (!categories || categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories]);
    
    const showModal = (category = null) => {
        if (category) {
            // Edit existing category
            setCategoryId(category.categoryId);
            setCategoryName(category.categoryName);
            setIsEditing(true);
        } else {
            // Add new category (generate new UUID)
            setCategoryId(uuidv4());
            setCategoryName('');
            setIsEditing(false);
        }
        setIsModalVisible(true);
    };

    const hideModal = () => {
        setCategoryName('');
        setCategoryId('');
        setIsEditing(false);
        setIsModalVisible(false);
    };

    const handleNameChange = (e) => setCategoryName(e.target.value);
    const handleSearchChange = (e) => setSearchQuery(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const categoryData = {
            categoryId,
            categoryName,
        };

        try {
            setIsSubmitting(true);
            if (isEditing) {
                // Update category
                await dispatch(updateCategory({ categoryId, categoryData })).unwrap();
            } else {
                // Add new category
                await dispatch(addCategory(categoryData)).unwrap();
            }
            await dispatch(fetchCategories()); // Fetch updated categories
            hideModal();
        } catch (error) {
            console.error('Failed to add/update category:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCategories = categories
    ? categories.filter((category) =>
          category?.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

    const indexOfLastCategory = currentPage * categoriesPerPage;
    const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
    const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);

    const columns = [
        {
            title: 'Category ID',
            dataIndex: 'categoryId',
            key: 'categoryId',
        },
        {
            title: 'Category Name',
            dataIndex: 'categoryName',
            key: 'categoryName',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text, record) => (
                <Button
                    icon={<EditOutlined />}
                    onClick={() => showModal(record)} // Use showModal directly
                    className="bg-green-600 text-white transition rounded-full"
                >
                    Edit
                </Button>
            ),
        },
    ];

    return (
        <div className="container mx-auto p-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-red-500 mb-2 md:mb-0">Categories</h2>
                <div className="flex items-center">
                    <Input
                        placeholder="Search by category name"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        style={{ marginRight: 16, width: '250px' }}
                    />
                    <Button
                        icon={<PlusOutlined />}
                        onClick={() => showModal()} // For adding a new category
                        className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white rounded-full"
                    >
                        Add Category
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center">
                    <Spin size="large" />
                </div>
            ) : error ? (
                <p className="text-red-500">Error: {error}</p>
            ) : (
                <Table
                    columns={columns}
                    dataSource={currentCategories}
                    bordered
                    rowKey="categoryId"
                    pagination={false}
                    style={{ marginBottom: '20px' }}
                />
            )}

            <Pagination
                current={currentPage}
                onChange={(page) => setCurrentPage(page)}
                pageSize={categoriesPerPage}
                total={filteredCategories.length}
                className="mt-4 text-center"
                showSizeChanger={false}
                showTotal={(total) => `Total ${total} categories`}
            />

            <Modal
                title={isEditing ? 'Edit Category' : 'Add New Category'}
                open={isModalVisible}
                onCancel={hideModal}
                footer={null}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700">Category ID:</label>
                        <input
                            type="text"
                            name="categoryId"
                            value={categoryId}
                            disabled
                            className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700">Category Name:</label>
                        <input
                            type="text"
                            name="categoryName"
                            value={categoryName}
                            onChange={handleNameChange}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Enter category name"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition flex items-center justify-center"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Spin size="small" className="mr-2" /> : null}
                        {isSubmitting ? 'Updating' : isEditing ? 'Update Category' : 'Add Category'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default AdminCategory
