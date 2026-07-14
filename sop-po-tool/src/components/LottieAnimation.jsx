import Lottie from 'lottie-react';
 
const LottieAnimation = ({
  animationData,
  width = 200,
  height = 200,
  loop = true,
  speed = 1,
  autoplay = true,
  style = {}
}) => {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      style={{
        width,
        height,
        ...style
      }}
      speed={speed}
    />
  );
};
 
export default LottieAnimation;
 