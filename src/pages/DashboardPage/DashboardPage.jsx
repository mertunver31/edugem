import React, { useState, useEffect } from 'react'
import { isDevelopmentMode } from '../../config/development'
import DashboardNavigation from '../../components/DashboardNavigation/DashboardNavigation'
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader'
import ProfilePage from '../ProfilePage/ProfilePage'
import CoursesPage from '../CoursesPage/CoursesPage'
import CreateCoursePage from '../CreateCoursePage/CreateCoursePage'
import AvatarPage from '../AvatarPage/AvatarPage'
import OnlineLessonsPage from '../OnlineLessonsPage/OnlineLessonsPage'
import TeachersPage from '../TeachersPage/TeachersPage'
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
import CourseVisualIntegration from '../../components/CourseVisualIntegration/CourseVisualIntegration'
import EnhancedContentTest from '../../components/EnhancedContentTest/EnhancedContentTest'
import PDFExtractionTest from '../../components/PDFExtractionTest/PDFExtractionTest'
import FullPipelineTest from '../../components/FullPipelineTest/FullPipelineTest'
import GeminiEmbeddingTest from '../../components/GeminiEmbeddingTest/GeminiEmbeddingTest'
import RetrievalTest from '../../components/RetrievalTest/RetrievalTest'
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
              const developmentTabs = ['pdf-test', 'gemini-test', 'document-understanding', 'segment-planner', 'task-queue', 'text-worker', 'image-worker', 'concurrency-control', 'pdf-pipeline', 'course-structure', 'course-visual-integration', 'enhanced-content', 'pdf-extraction', 'full-pipeline', 'gemini-embedding-test', 'retrieval-test']
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
      case 'avatar':
        return <AvatarPage />
      case 'lessons':
        return <TeachersPage />
      case 'course-create':
        return <CreateCoursePage />
      case 'online-lessons':
        return <OnlineLessonsPage />
      
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
      
      case 'course-visual-integration':
        return devMode ? <CourseVisualIntegration /> : <CoursesPage />
      
      case 'enhanced-content':
        return devMode ? <EnhancedContentTest /> : <CoursesPage />
      
      case 'pdf-extraction':
        return devMode ? <PDFExtractionTest /> : <CoursesPage />
      case 'full-pipeline':
        return devMode ? <FullPipelineTest /> : <CoursesPage />
                   case 'gemini-embedding-test':
               return devMode ? <GeminiEmbeddingTest /> : <CoursesPage />
             case 'retrieval-test':
               return devMode ? <RetrievalTest /> : <CoursesPage />
      
      default:
        return <CoursesPage />
    }
  }

  return (
    <div className="dashboard-page">
      <DashboardHeader />
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