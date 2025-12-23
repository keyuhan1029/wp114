'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Image from 'next/image';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface LoginPageLayoutProps {
  children: React.ReactNode;
}

export default function LoginPageLayout({ children }: LoginPageLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Left Column - Marketing Section */}
      <Box
        sx={{
          flex: '0 0 50%',
          backgroundColor: '#0F4C75',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Navigation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 2,
            mb: 4,
          }}
        >
          {isLoginPage ? (
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button
                variant="text"
                sx={{
                  color: '#ffffff',
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                SIGN IN
              </Button>
            </Link>
          ) : (
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button
                variant="text"
                sx={{
                  color: '#ffffff',
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                SIGN IN
              </Button>
            </Link>
          )}
          <Link href="/register" style={{ textDecoration: 'none' }}>
            <Button
              variant="outlined"
              sx={{
                color: '#ffffff',
                borderColor: '#ffffff',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                px: 3,
                '&:hover': {
                  borderColor: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              SIGN UP
            </Button>
          </Link>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            maxWidth: 500,
            mx: 'auto',
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 6 }}>
            <Image
              src="/logo.svg"
              alt="NTUGo Logo"
              width={200}
              height={60}
              priority
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Box>

          {/* Headline */}
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              color: '#ffffff',
              mb: 3,
              fontSize: { md: '3rem', lg: '3.5rem' },
              lineHeight: 1.2,
            }}
          >
            Your Campus Life. We Make It GO.™
          </Typography>

          {/* Sub-text */}
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1.125rem',
              lineHeight: 1.6,
              mb: 6,
            }}
          >
            Manage your schedule, connect with friends, discover campus events, and make the most of your NTU experience with NTUGo.
          </Typography>

          {/* Scroll Indicator */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mt: 'auto',
            }}
          >
            <KeyboardArrowDownIcon
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '2rem',
                animation: 'bounce 2s infinite',
                '@keyframes bounce': {
                  '0%, 100%': {
                    transform: 'translateY(0)',
                  },
                  '50%': {
                    transform: 'translateY(10px)',
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* Decorative Waveform */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
            background: 'linear-gradient(to top, rgba(15, 76, 117, 0.3), transparent)',
            opacity: 0.5,
          }}
        />
      </Box>

      {/* Right Column - Form Section */}
      <Box
        sx={{
          flex: { xs: '1 1 100%', md: '0 0 50%' },
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          padding: { xs: 3, md: 6 },
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Mobile Navigation */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 2,
            width: '100%',
            mb: 4,
          }}
        >
          {isLoginPage ? (
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button
                variant="text"
                sx={{
                  color: '#0F4C75',
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                SIGN IN
              </Button>
            </Link>
          ) : (
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button
                variant="text"
                sx={{
                  color: '#0F4C75',
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                SIGN IN
              </Button>
            </Link>
          )}
          <Link href="/register" style={{ textDecoration: 'none' }}>
            <Button
              variant="outlined"
              sx={{
                color: '#0F4C75',
                borderColor: '#0F4C75',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                px: 3,
                '&:hover': {
                  borderColor: '#0F4C75',
                  backgroundColor: 'rgba(15, 76, 117, 0.05)',
                },
              }}
            >
              GET STARTED FREE
            </Button>
          </Link>
        </Box>

        {/* Form Content */}
        <Box sx={{ width: '100%', maxWidth: 450 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}


