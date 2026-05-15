const AuthLayout = ({ children }) => {
  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    overflowY: "auto",
    backgroundImage: "url('/bg-auth.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },

  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(rgba(17,24,39,0.42), rgba(17,24,39,0.42))",
  },

  content: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};

export default AuthLayout;