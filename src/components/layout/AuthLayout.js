const AuthLayout = ({ children }) => {
  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      {children}
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundImage: "url('/bg-auth.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },

  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(29, 88, 92, 0.3)",
  },
};

export default AuthLayout;