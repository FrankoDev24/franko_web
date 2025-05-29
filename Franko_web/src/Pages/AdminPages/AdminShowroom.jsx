import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBrands } from "../../Redux/Slice/brandSlice";
import {
  fetchShowrooms,
  addShowroom,
  updateShowroom,
} from "../../Redux/Slice/showRoomSlice";
import {
  Button,
  Select,
  Typography,
  message,
  Spin,
  Modal,
  Form,
  Input,
  Pagination,
  Table
} from "antd";
import { v4 as uuidv4 } from "uuid";
import { DatePicker } from "antd";
import dayjs from "dayjs";

import { EditOutlined, PlusOutlined } from "@ant-design/icons";

const { Title } = Typography;

const AdminShowroom = () => {
  const dispatch = useDispatch();
  const { brands, loading: loadingBrands } = useSelector((state) => state.brands);
  const { showrooms, loading: loadingShowrooms } = useSelector((state) => state.showrooms);

  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentShowroom, setCurrentShowroom] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const showroomsPerPage = 8; // Showrooms per page

  useEffect(() => {
    dispatch(fetchBrands());
    dispatch(fetchShowrooms());
  }, [dispatch]);

const onFinish = (values) => {
  const showRoomID = currentShowroom ? currentShowroom.showRoomID : uuidv4();

  // Convert elapsed time to ISO format
  const showroomData = {
    Showroomid: showRoomID,
    ...values,
    elaspedTime: values.elaspedTime
      ? dayjs(values.elaspedTime).toISOString()
      : new Date().toISOString(),
  };
  if (isEditing) {
    dispatch(updateShowroom({ showRoomID, ...showroomData }))
      .unwrap()
      .then(() => {
        message.success("Showroom updated successfully!");
        resetForm();
      })
      .catch((error) => {
        message.error("Failed to update showroom: " + error.message);
      });
  } else {
    dispatch(addShowroom(showroomData))
      .unwrap()
      .then(() => {
        message.success("Showroom added successfully!");
        resetForm();
      })
      .catch((error) => {
        message.error("Failed to add showroom: " + error.message);
      });
  }
};

const handleEditShowroom = (showroom) => {
  setCurrentShowroom(showroom);
  form.setFieldsValue({
    showRoomID: showroom.showRoomID,
    showRoomName: showroom.showRoomName,
    brandId: showroom.brandId,
    showAtHomePage: showroom.showAtHomePage,
    orderIndex: showroom.orderIndex,
    headerColorCode: showroom.headerColorCode,
    elaspedTime: showroom.elaspedTime ? dayjs(showroom.elaspedTime) : null, // Convert string to DatePicker format
  });
  setIsEditing(true);
  setModalVisible(true);
};

  

const resetForm = () => {
    form.resetFields();
    setModalVisible(false);
    setIsEditing(false);
    setCurrentShowroom(null);
    dispatch(fetchShowrooms()); // Refresh showrooms after adding/updating
  };

  const showroomsWithBrandNames = showrooms.map((showroom) => {
    const brand = brands.find((b) => b.brandId === showroom.brandId);
    return {
      ...showroom,
      brandName: brand ? brand.brandName : "Unknown",
    };
  });

  // Pagination logic
  const indexOfLastShowroom = currentPage * showroomsPerPage;
  const indexOfFirstShowroom = indexOfLastShowroom - showroomsPerPage;
  const currentShowrooms = showroomsWithBrandNames.slice(
    indexOfFirstShowroom,
    indexOfLastShowroom
  );
 
  
  // Table Columns
  const columns = [
    {
      title: "Showroom Name",
      dataIndex: "showRoomName",
      key: "showRoomName",
    },
    {
      title: "Brand",
      dataIndex: "brandName",
      key: "brandName",
    },
    {
      title: "Show on Homepage",
      dataIndex: "showAtHomePage",
      key: "showAtHomePage",
      render: (value) => (value === 1 ? "Yes" : "No"),
    },
    {
      title: "Order Index",
      dataIndex: "orderIndex",
      key: "orderIndex",
    },
    {
      title: "Header Color",
      dataIndex: "headerColorCode",
      key: "headerColorCode",
      render: (color) => <span style={{ color }}>{color}</span>,
    },
    {
      title: "Elapsed Time",
      dataIndex: "elaspedTime",
      key: "elaspedTime",
      render: (date) => (dayjs(date).isValid() ? dayjs(date).format("YYYY-MM-DD HH:mm:ss") : "N/A"),
    },
    
    

    
    {
      title: "Actions",
      key: "actions",
      render: (_, showroom) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => handleEditShowroom(showroom)}
          className="bg-green-600 text-white transition rounded-full"
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="mx-auto p-6">
      <Title level={3} className="text-xl font-semibold mb-6" style={{ color: "red" }}>
        Showrooms
      </Title>

      {loadingBrands || loadingShowrooms ? (
        <div className="flex justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <>
          

          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              setModalVisible(true);
              setIsEditing(false);
            }}
            className="mb-6 bg-green-600 text-white transition rounded-full"
          >
            Add New Showroom
          </Button>

          <Modal
            title={isEditing ? "Update Showroom" : "Create Showroom"}
            open={modalVisible}
            onCancel={resetForm}
            footer={null}
            width={400}
          >
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item label="Showroom ID" name="showRoomID" hidden>
                <Input disabled />
              </Form.Item>

              <Form.Item
                label="Showroom Name"
                name="showRoomName"
                rules={[{ required: true, message: "Please input the showroom name!" }]}
              >
                <Input placeholder="Enter showroom name" />
              </Form.Item>

              <Form.Item
                label="Brand"
                name="brandId"
                rules={[{ required: true, message: "Please select a brand!" }]}
              >
                <Select placeholder="Select a brand">
                  {brands.map((brand) => (
                    <Select.Option key={brand.brandId} value={brand.brandId}>
                      {brand.brandName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="Show at Home Page" name="showAtHomePage">
                <Select placeholder="Select visibility">
                  <Select.Option value={1}>Yes</Select.Option>
                  <Select.Option value={0}>No</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Order Index"
                name="orderIndex"
                rules={[{ required: true, message: "Please input the order index!" }]}
              >
                <Input type="number" placeholder="Enter order index" />
              </Form.Item>

              <Form.Item
                label="Header Color Code"
                name="headerColorCode"
                rules={[{ required: true, message: "Please input the header color code!" }]}
              >
                <Input placeholder="Enter header color code" />
              </Form.Item>
              <Form.Item
  label="Elapsed Time (Sales End)"
  name="elaspedTime"
  rules={[{ required: true, message: "Please select the elapsed time!" }]}
>
  <DatePicker
    showTime
    format="YYYY-MM-DD HH:mm:ss"
    className="w-full"
    onChange={(_, dateString) => form.setFieldsValue({ elaspedTime: dateString })}
  />
</Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" className="w-full bg-green-800 hover:bg-green-700 transition">
                  {isEditing ? "Update Showroom" : "Add Showroom"}
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          <Table
            columns={columns}
            dataSource={currentShowrooms}
            bordered={true}
            rowKey="showRoomID"
            pagination={false}
            className="mb-6"
          />

          <Pagination
            current={currentPage}
            onChange={(page) => setCurrentPage(page)}
            pageSize={showroomsPerPage}
            total={showroomsWithBrandNames.length}
            className="text-center"
            showSizeChanger={false}
            showTotal={(total) => `Total ${total} showrooms`}
          />
        </>
      )}
    </div>
  );
};

export default AdminShowroom;
