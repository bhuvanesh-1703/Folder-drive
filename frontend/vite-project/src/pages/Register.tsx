import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import {useNavigate, Link } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [msgError, SetMsgError] = useState<string | null>("");



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return SetMsgError("passwords");
    }

    try {
      await axios.post("http://localhost:5100/api/auth/register", {
        name,
        email,
        password,
      });
      SetMsgError(null);
    } catch (err) {
      const error = err as AxiosError<{ msg: string }>;
      SetMsgError(error.response?.data?.msg || "something went wrong");
    }
  };

  return (
    <>
      <div>
        <h1>Register</h1>
      </div>
      {msgError && (
        <div>
          <p>{msgError}</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input type="text" value={name} name="name" placeholder="Enter your Name" onChange={(e) => setName(e.target.value)} />
        <input type="email" name="email" value={email} placeholder="Enter your Email" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" name="password" value={password} placeholder="Enter your Password" onChange={(e) => setPassword(e.target.value)} />
        <input type="password" name="confirmPassword" value={confirmPassword} placeholder="Enter your Confirm Password" onChange={(e) => setConfirmPassword(e.target.value)} />
        {msgError && <p>{msgError}</p>}
        <button type="submit">Register</button>
        <p>Alredy Have an Acount ? <Link to="/">Login</Link></p>
      </form>
    </>
  );
};

export default Register;
