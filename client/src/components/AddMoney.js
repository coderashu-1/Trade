// components/AddMoney.js
import React, { useState } from "react";
import { Button, Form, Container, Card } from "react-bootstrap";

const AddMoney = () => {
  const [amount, setAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`You are adding $${amount} to your wallet!`);
    // You can trigger backend API here
    setAmount("");
  };

  return (
    <Container className="d-flex justify-content-center align-items-center mt-5">
      <Card className="p-4 shadow" style={{ width: "400px" }}>
        <h3 className="mb-4 text-center text-primary">Add Money to Wallet</h3>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formAmount">
            <Form.Label>Enter Amount (USD)</Form.Label>
            <Form.Control
              type="number"
              placeholder="e.g. 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={1}
            />
          </Form.Group>
          <Button variant="success" type="submit" className="w-100 mt-3">
            Add Money
          </Button>
        </Form>
      </Card>
    </Container>
  );
};

export default AddMoney;
