"use client";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { useState, ReactNode, Dispatch, SetStateAction } from "react";
import { CloseIcon } from "@mantine/core";
interface Props {
  title: string;
  children: ReactNode;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}
export default function CustomModal({ title, children, open, setOpen }: Props) {
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          width: "40px",
          height: "40px",
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}
