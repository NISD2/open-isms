import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

// Still — "one coffee and you're all over the walls" meme frame.
// Render with: npx remotion still Standup-06-03-Meme out/meme-one-coffee.png
// Adjust MEME_FRAME to pick the best expression moment.
// "all over the walls" peaks around ms 102,960 → frame 3089.
const MEME_FRAME = 3089;

export const StandupMeme: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo
        src={staticFile("standup-06-03.mp4")}
        trimBefore={MEME_FRAME}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 50%",
        }}
      />
    </AbsoluteFill>
  );
};
