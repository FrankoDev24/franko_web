// UserRegistration.jsx
import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { createUser } from '../../Redux/Slice/userSlice';
import { useNavigate, Link } from 'react-router-dom';
import Franko from "../../assets/frankoIcon.png";
import withAccessCode from '../../Component/withAccessCode';

const UserRegistration = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = (values) => {
    setLoading(true);

    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match!');
      setLoading(false);
      return;
    }

    const newUser = {
      uuserid: uuidv4(),
      fullName: values.fullName,
      email: values.email,
      password: values.password,
      address: values.address,
      contact: values.contact,
      position: values.position,
    };

    dispatch(createUser(newUser))
      .unwrap()
      .then(() => {
        message.success('User registered successfully!');
        form.resetFields();
        navigate('/admin/login');
      })
      .catch((error) => {
        message.error(`Registration failed: ${error.message || error}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onFinishFailed = (errorInfo) => {
    console.error(errorInfo);
    message.error('Please fill in all required fields!');
  };

  // Just render the registration form - HOC handles access code
  return (
    <div className="max-w-lg mx-auto px-4 py-8 bg-white shadow-lg rounded-lg mt-20">
      {/* Logo */}
      <div className="text-center mb-8">
        <img src={Franko} alt="Franko Trading" className="mx-auto h-16 w-24" />
      </div>

      {/* Registration Form */}
      <h2 className="text-xl font-bold text-center mb-6">Sign up</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        className="space-y-4"
      >
        <Form.Item
          label="Full Name"
          name="fullName"
          rules={[{ required: true, message: 'Please input your full name!' }]}
        >
          <Input className="w-full p-2 border rounded-md" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input className="w-full p-2 border rounded-md" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password className="w-full p-2 border rounded-md" />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          rules={[{ required: true, message: 'Please confirm your password!' }]}
        >
          <Input.Password className="w-full p-2 border rounded-md" />
        </Form.Item>

        <Form.Item
          label="Address"
          name="address"
          rules={[{ required: true, message: 'Please input your address!' }]}
        >
          <Input className="w-full p-2 border rounded-md" />
        </Form.Item>

        <Form.Item
          label="Contact"
          name="contact"
          rules={[{ required: true, message: 'Please input your contact number!' }]}
        >
          <Input className="w-full p-2 border rounded-md" />
        </Form.Item>

        <Form.Item
          label="Position"
          name="position"
          rules={[{ required: true, message: 'Please input your position!' }]}
        >
          <Input className="w-full p-2 border rounded-md" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full bg-green-800 text-white p-2 rounded-md"
          >
            Register
          </Button>
        </Form.Item>
      </Form>

      {/* Already Registered? Login Link */}
      <div className="text-center mt-4">
        <p>
          Already registered?{' '}
          <Link to="/admin/login" className="text-blue-500 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

// HOC handles all access code logic automatically
export default withAccessCode(UserRegistration);