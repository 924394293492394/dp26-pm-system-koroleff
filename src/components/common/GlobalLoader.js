import { Spin } from "antd";
// import { BallTriangle} from 'react-loader-spinner'
import { useLoader } from "../../context/LoaderContext";

const GlobalLoader = () => {
    const { loading } = useLoader();

    if (!loading) return null;

    return (
        <div style={styles.overlay}>
            <Spin size="large" />
            {/* <BallTriangle
                height={100}
                width={100}
                radius={5}
                color="#4fa94d"
                ariaLabel="ball-triangle-loading"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
            /> */}
        </div>
    );
};

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.25)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
    },
};

export default GlobalLoader;