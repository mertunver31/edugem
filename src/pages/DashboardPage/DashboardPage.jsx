import React, { useState, useEffect } from 'react'
import { isDevelopmentMode } from '../../config/development'
import DashboardNavigation from '../../components/DashboardNavigation/DashboardNavigation'
import ProfilePage from '../ProfilePage/ProfilePage'
import CoursesPage from '../CoursesPage/CoursesPage'
import CreateCoursePage from '../CreateCoursePage/CreateCoursePage'
import AvatarPage from '../AvatarPage/AvatarPage'
import PDFTestArea from '../../components/PDFTestArea/PDFTestArea'
import GeminiTestArea from '../../components/GeminiTestArea/GeminiTestArea'
import DocumentUnderstandingTest from '../../components/DocumentUnderstandingTest/DocumentUnderstandingTest'
import SegmentPlannerTest from '../../components/SegmentPlannerTest/SegmentPlannerTest'
import TaskQueueTest from '../../components/TaskQueueTest/TaskQueueTest'
import TextWorkerTest from '../../components/TextWorkerTest/TextWorkerTest'
import ImageWorkerTest from '../../components/ImageWorkerTest/ImageWorkerTest'
import ConcurrencyControlTest from '../../components/ConcurrencyControlTest/ConcurrencyControlTest'
import PDFPipelineTest from '../../components/PDFPipelineTest/PDFPipelineTest'
import CourseStructureTest from '../../components/CourseStructureTest/CourseStructureTest'
import './DashboardPage.css'

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('courses')
  const [devMode, setDevMode] = useState(isDevelopmentMode())

  useEffect(() => {
    setDevMode(isDevelopmentMode())
  }, [])

  // Development mode değiştiğinde active tab'ı kontrol et
  useEffect(() => {
    if (!devMode) {
      // Development mode kapandığında, eğer development tab'ındaysa courses'a yönlendir
      const developmentTabs = ['pdf-test', 'gemini-test', 'document-understanding', 'segment-planner', 'task-queue', 'text-worker', 'image-worker', 'concurrency-control', 'pdf-pipeline']
      if (developmentTabs.includes(activeTab)) {
        setActiveTab('courses')
      }
    }
  }, [devMode, activeTab])

  const renderActiveTab = () => {
    switch (activeTab) {
      // Production Components - Her zaman erişilebilir
      case 'profile':
        return <ProfilePage />
      case 'courses':
        return <CoursesPage />
      case 'create-course':
        return <CreateCoursePage />
      case 'avatar':
        return <AvatarPage />
      
      // Development Components - Sadece development mode'da erişilebilir
      case 'pdf-test':
        return devMode ? <PDFTestArea /> : <CoursesPage />
      case 'gemini-test':
        return devMode ? <GeminiTestArea /> : <CoursesPage />
      case 'document-understanding':
        return devMode ? <DocumentUnderstandingTest /> : <CoursesPage />
      case 'segment-planner':
        return devMode ? <SegmentPlannerTest /> : <CoursesPage />
      case 'task-queue':
        return devMode ? <TaskQueueTest /> : <CoursesPage />
      case 'text-worker':
        return devMode ? <TextWorkerTest /> : <CoursesPage />
      case 'image-worker':
        return devMode ? <ImageWorkerTest /> : <CoursesPage />
      case 'concurrency-control':
        return devMode ? <ConcurrencyControlTest /> : <CoursesPage />
      case 'pdf-pipeline':
        return devMode ? <PDFPipelineTest /> : <CoursesPage />
      
      case 'course-structure':
        return devMode ? <CourseStructureTest /> : <CoursesPage />
      
      default:
        return <CoursesPage />
    }
  }

  return (
    <div className="dashboard-page">
      <DashboardNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        devMode={devMode}
        setDevMode={setDevMode}
      />
      <div className="dashboard-content">
        {renderActiveTab()}
      </div>
    </div>
  )
}

export default DashboardPage 