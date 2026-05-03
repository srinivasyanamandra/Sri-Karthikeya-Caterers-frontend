import React from 'react';
import Hero from '../components/home/Hero';
import StorySection from '../components/home/StorySection';
import ServicesPreview from '../components/home/ServicesPreview';
import MenuPreview from '../components/home/MenuPreview';
import GalleryPreview from '../components/home/GalleryPreview';
import TestimonialsPreview from '../components/home/TestimonialsPreview';
import PlanYourEventCTA from '../components/home/PlanYourEventCTA';

const HomePage = () => (
  <>
    <Hero />
    <StorySection />
    <ServicesPreview />
    <MenuPreview />
    <GalleryPreview />
    <TestimonialsPreview />
    <PlanYourEventCTA />
  </>
);

export default HomePage;
