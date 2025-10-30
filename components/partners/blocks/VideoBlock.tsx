import { VideoBlockData } from '@/lib/types/partner';

interface VideoBlockProps {
  data: VideoBlockData;
}

export default function VideoBlock({ data }: VideoBlockProps) {
  // Extract video ID from YouTube or Vimeo URL
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)?.[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(data.videoUrl);

  return (
    <div className="py-12 px-4 bg-gray-900">
      <div className="container-custom max-w-5xl mx-auto">
        {(data.title || data.description) && (
          <div className="text-center mb-8">
            {data.title && (
              <h2 className="text-3xl font-bold text-white mb-3">
                {data.title}
              </h2>
            )}
            {data.description && (
              <p className="text-lg text-gray-300">
                {data.description}
              </p>
            )}
          </div>
        )}
        
        <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
          <iframe
            src={embedUrl}
            title={data.title || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}

