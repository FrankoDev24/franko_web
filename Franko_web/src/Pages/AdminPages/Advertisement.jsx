import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Form, Input, Button, Upload, message, Modal, Select, Image } from "antd";
import { UploadOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { postAdvertisment, getAdvertisment, putAdvertisment } from "../../Redux/Slice/advertismentSlice";

const { Option } = Select;
const adOptions = ["Home Page", "Banner", "Phone Page", "Laptop Page", "Tablet Page"];

const AdvertisementPage = () => {
  const dispatch = useDispatch();
  const { advertisments, loading } = useSelector((state) => state.advertisment);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [selectedAdsName, setSelectedAdsName] = useState("Banner");
  const [imagePreview, setImagePreview] = useState({ visible: false, fileName: "" });
  const [previewLogo, setPreviewLogo] = useState(null);
const [isModalVisible, setIsModalVisible] = useState(false);

  const backendBaseURL = "https://smfteapi.salesmate.app";


  // Fetch Advertisements whenever the selectedAdsName changes
  useEffect(() => {
  dispatch(getAdvertisment(selectedAdsName))
  .unwrap()
  .then((data) => {
    console.log("Fetched data:", data); // Check what is returned
  })
  .catch(() => {
    message.error("Failed to fetch advertisements");
  });

  }, [selectedAdsName, dispatch]);

  // Add Advertisement
  const handlePost = (values) => {
    const formData = new FormData();
    formData.append("AdsName", values.AdsName);
    formData.append("IndexOrder", values.IndexOrder);
    formData.append("AdsNote", values.AdsNote);
    formData.append("FileName", values.FileName.file);

    dispatch(postAdvertisment(formData))
      .unwrap()
      .then(() => {
        message.success("Advertisement added successfully");
        form.resetFields();
        setSelectedAdsName(values.AdsName);
        setAddModalVisible(false);
      })
      .catch((err) => message.error(err));
  };

  // Edit Advertisement
  const handleEdit = (values) => {
    const fileId = values.Fileid || selectedAd?.fileId; // Ensure correct key
  
    console.log("File ID extracted:", fileId);
  
    if (!fileId) {
      message.error("File ID is missing!");
      return;
    }
  
    let fileToUpload = null;
    if (values.FileName && values.FileName.fileList && values.FileName.fileList.length > 0) {
      fileToUpload = values.FileName.fileList[0].originFileObj;
    } else {
      message.error("Please upload an image.");
      return;
    }
  
    console.log("File to Upload:", fileToUpload);
  
    const formData = new FormData();
    formData.append("Fileid", fileId);
    formData.append("AdsName", values.AdsName);
    formData.append("IndexOrder", values.IndexOrder);
    formData.append("AdsNote", values.AdsNote);
    formData.append("FileName", fileToUpload);
  
    // Debugging: Log formData entries
    console.log("FormData before dispatch:");
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
  
    dispatch(putAdvertisment({ Fileid: fileId, AdsName: values.AdsName, IndexOrder: values.IndexOrder, AdsNote: values.AdsNote, FileName: fileToUpload }))
      .unwrap()
      .then(() => {
        message.success("Advertisement updated successfully");
        setEditModalVisible(false);
      })
      .catch((err) => {
        console.error("Update failed:", err);
        message.error(err);
      });
  };
  
  

  // Open Edit Modal
  
  const handleEditClick = (record) => {
    console.log("Selected Ad Record:", record); // Debugging
  
    setSelectedAd(record);
    editForm.setFieldsValue({
      AdsName: record.adsName,
      IndexOrder: record.indexOrder,
      AdsNote: record.adsNote,
      Fileid: record.fileId, // Ensure this matches API expectations
    });
  
    console.log("Form values set in modal:", {
      AdsName: record.adsName,
      IndexOrder: record.indexOrder,
      AdsNote: record.adsNote,
      Fileid: record.fileId,
    });
  
    setEditModalVisible(true);
  };
  
  
  // Open Image Preview
  const handleImageClick = (imageUrl) => {
    if (imageUrl) {
      setPreviewLogo(imageUrl);
      setIsModalVisible(true);
    } 
  };
  

  // Table Columns
  const columns = [
    { title: "File ID", dataIndex: "fileId", key: "fileId" },
    { title: "Ads Name", dataIndex: "adsName", key: "adsName" },
    { title: "Ads Note", dataIndex: "adsNote", key: "adsNote" },
    {
      title: "Image",
      dataIndex: "fileName",
      key: "fileName",
      render: (fileName) => {
        if (!fileName) {
          return <span>No Image</span>; // Show a fallback message
        }
    
        const imageUrl = `${backendBaseURL}/Media/Ads/${fileName.split("\\").pop()}`;
        return (
          <img
            src={imageUrl}
            alt="Advertisement"
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            onClick={() => handleImageClick(imageUrl)}
          />
        );
      },
    },
    
    
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button icon={<EditOutlined />} onClick={() => handleEditClick(record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Manage Advertisements</h2>

      {/* Dropdown & Fetch Button */}
      <div className="mb-4 flex gap-4">
        <Select
          value={selectedAdsName}
          onChange={setSelectedAdsName}
          style={{ width: 250 }}
        >
          {adOptions.map((option) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
          Add Advertisement
        </Button>
      </div>

      {/* Advertisement Table */}
      <Table
        dataSource={advertisments}
        columns={columns}
        rowKey="fileId"
        loading={loading}
        className="mt-6"
        bordered
      />

      {/* Image Modal */}
      <Modal
        visible={imagePreview.visible}
        footer={null}
        onCancel={() => setImagePreview({ visible: false, fileName: "" })}
      >
        <img src={imagePreview.fileName} alt="Preview" style={{ width: "100%" }} />
      </Modal>

      {/* Add Advertisement Modal */}
      <Modal
        title="Add Advertisement"
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handlePost} layout="vertical">
          <Form.Item name="AdsName" label="Advertisement Name" rules={[{ required: true }]}>
            <Select placeholder="Select advertisement name">
              {adOptions.map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="IndexOrder" label="Index Order" rules={[{ required: true }]}>
            <Input placeholder="Enter index order" />
          </Form.Item>
          <Form.Item name="AdsNote" label="Advertisement Note">
            <Input.TextArea placeholder="Enter advertisement note" />
          </Form.Item>
          <Form.Item name="FileName" label="Upload Image" rules={[{ required: true }]}>
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
            Add Advertisement
          </Button>
        </Form>
      </Modal>

      {/* Edit Advertisement Modal */}
      <Modal
        title="Edit Advertisement"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={editForm} onFinish={handleEdit} layout="vertical">
          <Form.Item name="AdsName" label="Advertisement Name" rules={[{ required: true }]}>
            <Select>
              {adOptions.map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="IndexOrder" label="Index Order" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="AdsNote" label="Advertisement Note">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="FileName" label="Upload New Image">
  <Upload beforeUpload={() => false} maxCount={1}>
    <Button icon={<UploadOutlined />}>Click to Upload</Button>
  </Upload>
</Form.Item>

          <Button type="primary" htmlType="submit" loading={loading}>
            Update Advertisement
          </Button>
        </Form>
      </Modal>
      <Modal
  visible={isModalVisible}
  footer={null}
  onCancel={() => setIsModalVisible(false)}
>
  <Image src={previewLogo} alt="Preview" />
</Modal>

    </div>
  );
};

export default AdvertisementPage;
