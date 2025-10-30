import PackRip from "@/components/pack-rip";

export default function Home() {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center">
      <PackRip
        packTexture="/pack-diffuse2.png"
        cards={[
          {
            frontImage: "/cards/acoustic-charity.webp",
            backImage: "/cards/card-back.png",
          },
          {
            frontImage: "/cards/dadbod.avif",
            backImage: "/cards/card-back.png",
          },
          {
            frontImage: "/cards/wossumnomicron-scaled.avif",
            backImage: "/cards/card-back.png",
          },
        ]}
      />
    </div>
  );
}
