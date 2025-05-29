import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../../Redux/Slice/userSlice";
import { Table, Spin, Alert, Input } from "antd";

const { Search } = Input;

const Users = () => {
  const dispatch = useDispatch();
  const { users = [], loading, error } = useSelector((state) => state.user);

  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {

  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!searchText) return users;
    const lowercasedValue = searchText.toLowerCase();

    return users.filter(
      (user) =>
        user?.fullName?.toLowerCase().includes(lowercasedValue) ||
        user?.contact?.toLowerCase().includes(lowercasedValue) ||
        user?.position?.toLowerCase().includes(lowercasedValue)
    );
  }, [users, searchText]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const columns = [
    { title: "ID", dataIndex: "uuserid", key: "uuserid" },
    { title: "Name", dataIndex: "fullName", key: "fullName" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Contact", dataIndex: "contact", key: "contact" },
    { title: "Address", dataIndex: "address", key: "address" },
    { title: "Position", dataIndex: "position", key: "position" },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-red-500">Users</h1>

      <Search
        placeholder="Search by name, contact number, or position"
        allowClear
        enterButton="Search"
        size="large"
        onSearch={handleSearch}
        onChange={(e) => handleSearch(e.target.value)}
        value={searchText}
        style={{ marginBottom: "20px", maxWidth: "500px" }}
      />

      {loading ? (
        <div className="flex justify-center items-center">
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert message="Error" description={error} type="error" showIcon />
      ) : filteredUsers.length > 0 ? (
        <Table
          dataSource={filteredUsers.map((user, index) => ({
            ...user,
            key: user.uuserid || index, // Ensure unique row key
          }))}
          columns={columns}
          bordered
          pagination={{ pageSize: 10 }}
        />
      ) : (
        <Alert message="No users found" type="info" showIcon />
      )}
    </div>
  );
};

export default Users;
