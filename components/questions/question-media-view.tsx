import { QuestionMedia } from "@/lib/types";

export function QuestionMediaView({ media }: { media?: QuestionMedia }) {
  if (!media || media.kind !== "image") {
    return null;
  }

  return (
    <div className="soft-card question-media-card">
      <img
        src={media.src}
        alt={media.alt}
        width={media.width}
        height={media.height}
        className="question-media-image"
      />
      {media.caption ? <p className="question-media-caption">{media.caption}</p> : null}
    </div>
  );
}
