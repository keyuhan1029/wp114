'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import OnboardingTutorial from '@/components/Onboarding/OnboardingTutorial';

// 教学幻灯片数据
const tutorialSlides = [
  {
    image: '/tutorial/slide-1.png',
    title: '探索校園地圖',
    description: '查看即時交通資訊（捷運、公車、Ubike）、探索校園設施，輕鬆找到目的地。',
  },
  {
    image: '/tutorial/slide-2.png',
    title: '加入社群',
    description: '查看好友列表、傳送訊息，與同學交流互動，建立新的友誼。',
  },
  {
    image: '/tutorial/slide-3.png',
    title: '管理您的課表',
    description: '建立個人課表，與好友分享課程，隨時掌握上課時間。',
  },
  {
    image: '/tutorial/slide-4.png',
    title: '管理行事曆',
    description: '查看學校行事曆，加入重要活動，輕鬆掌握校園大小事。',
  },
  {
    image: '/tutorial/slide-5.svg',
    title: '開始您的旅程',
    description: '現在就開始探索NTUGO的所以功能吧！',
  }
];

export default function TutorialPage() {
  const router = useRouter();

  const handleComplete = () => {
    // 跳转到主页面
    router.push('/');
  };

  return <OnboardingTutorial slides={tutorialSlides} onComplete={handleComplete} />;
}
