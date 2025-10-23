import React from 'react';

interface ContentAdsVisualizationProps {
  adsPercentage: number;
}

export const ContentAdsVisualization: React.FC<ContentAdsVisualizationProps> = ({ adsPercentage }) => {
  // Calculate how many blocks to show (using 7 blocks like in the image)
  const totalBlocks = 7;
  const contentPercentage = 100 - adsPercentage;

  // Calculate number of ads blocks vs content blocks
  const adsBlocks = Math.round((adsPercentage / 100) * totalBlocks);
  const contentBlocks = totalBlocks - adsBlocks;

  // Create alternating pattern
  const blocks = [];
  const adsBlockSize = adsBlocks > 0 ? totalBlocks / adsBlocks : 0;
  const contentBlockSize = contentBlocks > 0 ? totalBlocks / contentBlocks : 0;

  // If one type is 100%, show all of that type
  if (adsPercentage >= 95) {
    for (let i = 0; i < totalBlocks; i++) {
      blocks.push({ type: 'ads', id: i });
    }
  } else if (adsPercentage <= 5) {
    for (let i = 0; i < totalBlocks; i++) {
      blocks.push({ type: 'content', id: i });
    }
  } else {
    // Create alternating pattern based on ratio
    let adsRemaining = adsBlocks;
    let contentRemaining = contentBlocks;
    let position = 0;

    while (position < totalBlocks) {
      // Alternate between content and ads
      if (contentRemaining > 0) {
        blocks.push({ type: 'content', id: position });
        contentRemaining--;
        position++;
      }

      if (adsRemaining > 0 && position < totalBlocks) {
        blocks.push({ type: 'ads', id: position });
        adsRemaining--;
        position++;
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Content: {contentPercentage}%</span>
        <span>Ads: {adsPercentage}%</span>
      </div>

      <div className="flex gap-1 h-20 border border-border rounded-md overflow-hidden bg-muted/20">
        {blocks.map((block) => (
          <div
            key={block.id}
            className={`flex-1 flex items-center justify-center text-white font-semibold transition-all duration-300 ${
              block.type === 'ads'
                ? 'bg-accent hover:bg-accent/90'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            <span className="text-xs sm:text-sm">
              {block.type === 'ads' ? 'ADS' : 'Content'}
            </span>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Visual representation of content rotation
      </div>
    </div>
  );
};
