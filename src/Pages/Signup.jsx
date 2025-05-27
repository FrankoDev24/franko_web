import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Input,
    Button,
    Typography,
  } from "@material-tailwind/react";
  import {
    UserIcon,
    LockClosedIcon,
    HomeIcon,
    PhoneIcon,
    EnvelopeIcon,
  } from "@heroicons/react/24/outline";
  import { useState, useEffect } from "react";
  import { useDispatch } from "react-redux";
  import { createCustomer } from "../Redux/Slice/customerSlice";
  import { v4 as uuidv4 } from "uuid";
  import logo from "../frankoIcon.png";
  
  const SignupModal = ({ open, handleClose }) => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
      customerAccountNumber: "",
      firstName: "",
      lastName: "",
      contactNumber: "",
      address: "",
      password: "",
      accountType: "customer",
      email: "",
      accountStatus: "1",
    });
  
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      setFormData((prev) => ({
        ...prev,
        customerAccountNumber: uuidv4(),
      }));
    }, [open]);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };
  
    const handleSubmit = async () => {
      setLoading(true);
      try {
        await dispatch(createCustomer(formData)).unwrap();
        if (typeof window.fbq === "function") {
          window.fbq("track", "CompleteRegistration", {
            content_name: "Customer Registration",
            status: "success",
            currency: "GHS",
            email: formData.email,
          });
        }
        setLoading(false);
        handleClose(); // Close modal
      } catch (error) {
        console.error("Registration error:", error);
        setLoading(false);
      }
    };
  
    return (
      <Dialog open={open} handler={handleClose} size="sm">
        <DialogHeader className="justify-center">
          <img src={logo} alt="Logo" className="w-20 h-20" />
        </DialogHeader>
        <DialogBody className="space-y-4">
          <Typography variant="h5" color="blue-gray" className="text-center">
            Register
          </Typography>
  
          <div className="flex flex-col gap-4">
            <Input
              label="First Name"
              name="firstName"
              icon={<UserIcon className="h-5 w-5" />}
              onChange={handleChange}
            />
            <Input
              label="Last Name"
              name="lastName"
              icon={<UserIcon className="h-5 w-5" />}
              onChange={handleChange}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              icon={<EnvelopeIcon className="h-5 w-5" />}
              onChange={handleChange}
            />
            <Input
              label="Contact Number"
              name="contactNumber"
              icon={<PhoneIcon className="h-5 w-5" />}
              onChange={handleChange}
            />
            <Input
              label="Address"
              name="address"
              icon={<HomeIcon className="h-5 w-5" />}
              onChange={handleChange}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              icon={<LockClosedIcon className="h-5 w-5" />}
              onChange={handleChange}
            />
          </div>
        </DialogBody>
        <DialogFooter className="flex flex-col gap-2">
          <Button
            fullWidth
            onClick={handleSubmit}
            loading={loading}
            className="bg-green-800"
          >
            Register
          </Button>
          <Typography
            variant="small"
            className="text-center text-sm text-blue-500 cursor-pointer"
            onClick={handleClose}
          >
            Already registered? Login
          </Typography>
        </DialogFooter>
      </Dialog>
    );
  };
  
  export default SignupModal;
  