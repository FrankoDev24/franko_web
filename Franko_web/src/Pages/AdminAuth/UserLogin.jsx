// UserLogin.jsx
import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../Redux/Slice/userSlice';
import logo from "../../assets/frankoIcon.png";
import withAccessCode from '../../Component/withAccessCode';

const UserLogin = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.user);
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');

  const onFinish = () => {
    dispatch(loginUser({ contact, password }))
      .unwrap()
      .then((userData) => {
        message.success('Login successful!');
        const position = userData?.position;

        switch (position) {
          case 'Supervisor':
            navigate('/admin/dashboard');
            break;
          case 'Webcontentmanager':
            navigate('/content/dashboard');
            break;
          case 'Fulfillment':
            navigate('/fulfillment/dashboard');
            break;
          case 'Developer':
            navigate('/dev/dashboard');
            break;
          case 'Social':
            navigate('/digi/orders');
            break;
          default:
            navigate('/');
        }
      })
      .catch((error) => {
        message.error(`Login failed: ${error}`);
      });
  };

  const onFinishFailed = (errorInfo) => {
    message.error('Please fill in all required fields!');
    console.error('Failed:', errorInfo);
  };

  // Just render the login form - HOC handles access code
  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg mt-40">
      {/* Logo */}
      <div className="text-center mb-6">
        <img src={logo} alt="Logo" className="mx-auto h-16 w-24" />
      </div>

      {/* Login Form */}
      <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        className="space-y-4"
      >
        <Form.Item
          label="Contact Number"
          name="contact"
          rules={[{ required: true, message: 'Please input your contact number!' }]}
        >
          <Input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Enter your contact number"
            className="w-full p-2 border rounded-md"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full p-2 border rounded-md"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full bg-green-700 text-white p-2 rounded-md"
          >
            Login
          </Button>
        </Form.Item>
      </Form>

      {/* Sign Up Link */}
      <div className="text-center mt-4">
        <p>
          Don&apos;t have an account?{' '}
          <Link to="/admin/process" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

// HOC handles all access code logic
export default withAccessCode(UserLogin);