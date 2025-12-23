'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface TutorialSlide {
  image: string;
  title: string;
  description: string;
}

interface OnboardingTutorialProps {
  slides: TutorialSlide[];
  onComplete: () => void;
}

export default function OnboardingTutorial({ slides, onComplete }: OnboardingTutorialProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const totalSlides = slides.length;
  const isLastSlide = currentIndex === totalSlides - 1;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalSlides - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const currentSlide = slides[currentIndex];

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '90%',
          maxWidth: 800,
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 图片区域 */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '60vh',
            minHeight: 400,
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* 左箭头 */}
          {currentIndex > 0 && (
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#0F4C75',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                },
                zIndex: 10,
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}

          {/* 图片 */}
          <Box
            component="img"
            src={currentSlide.image}
            alt={currentSlide.title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />

          {/* 右箭头 */}
          {!isLastSlide && (
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#0F4C75',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                },
                zIndex: 10,
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          )}
        </Box>

        {/* 文字区域 */}
        <Box
          sx={{
            p: 4,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{
              mb: 2,
              fontWeight: 700,
              color: '#212121',
              textAlign: 'center',
            }}
          >
            {currentSlide.title}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: '#757575',
              textAlign: 'center',
              lineHeight: 1.6,
              maxWidth: 600,
            }}
          >
            {currentSlide.description}
          </Typography>

          {/* 分页指示器（小点点） */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mb: 3,
            }}
          >
            {slides.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentIndex(index)}
                sx={{
                  width: currentIndex === index ? 32 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: currentIndex === index ? '#0F4C75' : '#e0e0e0',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: currentIndex === index ? '#0F4C75' : '#bdbdbd',
                  },
                }}
              />
            ))}
          </Box>

          {/* 最后一张显示"开始体验！"按钮 */}
          {isLastSlide && (
            <Button
              variant="contained"
              onClick={handleComplete}
              sx={{
                py: 1.5,
                px: 6,
                borderRadius: 2,
                backgroundColor: '#0F4C75',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1.1rem',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#0a3a5a',
                },
              }}
            >
              開始體驗！
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

