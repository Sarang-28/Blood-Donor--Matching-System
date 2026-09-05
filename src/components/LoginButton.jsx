import { Button } from "@mui/material";
import { motion } from "framer-motion";

const MotionButton = motion.create(Button);

function LoginButton({ children = "Login", ...props }) {
  return (
    <MotionButton
      variant="contained"
      fullWidth
      size="large"
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      sx={{
        mt: 3,
        py: 1.5,
        borderRadius: 3,
        fontSize: "16px",
        fontWeight: "bold",
        textTransform: "none",
      }}
      {...props}
    >
      {children}
    </MotionButton>
  );
}

export default LoginButton;
