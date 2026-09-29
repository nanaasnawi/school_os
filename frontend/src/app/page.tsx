'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  Globe,
  Heart,
  Star,
  BookOpen,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bookmark,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import styles from './page.module.css';

/* ── Sinsu Logo SVG Component ── */
function SinsuBrandLogo({ size = 32 }: { size?: number }) {
  return (
    <div className={styles.logoIcon}>
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sinsuGrad" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <path
          d="M10 24C6.5 20.5 7.5 13 12.5 9.5C17.5 6 23.5 7.5 27 11.5C30.5 15.5 29.5 22.5 25.5 26.5C21.5 30.5 15.5 29 11 25"
          stroke="url(#sinsuGrad)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M12 25L25 11"
          stroke="#2563EB"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* ── 3D Feature Icons for "Why Sinsu?" ── */
function LearnAnywhereIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="10" y="18" width="28" height="22" rx="4" fill="#F43F5E" fillOpacity="0.85" />
      <path d="M6 20L24 6L42 20" stroke="#06B6D4" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="27" width="8" height="13" rx="2" fill="#FFFFFF" />
      <circle cx="16" cy="24" r="2.5" fill="#FFFFFF" />
      <circle cx="32" cy="24" r="2.5" fill="#FFFFFF" />
    </svg>
  );
}

function CaseStudiesIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="10" y="10" width="28" height="32" rx="4" fill="#06B6D4" fillOpacity="0.18" stroke="#06B6D4" strokeWidth="3" />
      <rect x="16" y="6" width="16" height="8" rx="2" fill="#8B5CF6" />
      <line x1="16" y1="22" x2="32" y2="22" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="28" x2="28" y2="28" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="34" x2="24" y2="34" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function DiscussionGroupIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="10" width="24" height="18" rx="6" fill="#06B6D4" />
      <path d="M12 28L8 34V28H12Z" fill="#06B6D4" />
      <circle cx="15" cy="19" r="2" fill="#FFFFFF" />
      <circle cx="20" cy="19" r="2" fill="#FFFFFF" />
      <rect x="18" y="18" width="22" height="17" rx="6" fill="#8B5CF6" />
      <path d="M34 35L38 40V35H34Z" fill="#8B5CF6" />
      <circle cx="25" cy="26" r="1.8" fill="#FFFFFF" />
      <circle cx="29" cy="26" r="1.8" fill="#FFFFFF" />
    </svg>
  );
}

function ScheduleMentorIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="10" width="32" height="30" rx="6" fill="#06B6D4" fillOpacity="0.15" stroke="#06B6D4" strokeWidth="3" />
      <path d="M8 18H40" stroke="#06B6D4" strokeWidth="3" />
      <rect x="14" y="6" width="4" height="8" rx="2" fill="#8B5CF6" />
      <rect x="30" y="6" width="4" height="8" rx="2" fill="#8B5CF6" />
      <circle cx="24" cy="28" r="4.5" fill="#8B5CF6" />
    </svg>
  );
}

function CertificateIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="10" width="32" height="26" rx="4" fill="#06B6D4" fillOpacity="0.2" stroke="#06B6D4" strokeWidth="3" />
      <line x1="14" y1="18" x2="34" y2="18" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="14" y1="24" x2="26" y2="24" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="34" cy="30" r="5" fill="#F43F5E" />
      <path d="M32 35L31 41L34 39L37 41L36 35" fill="#F43F5E" />
    </svg>
  );
}

function UploadPortfolioIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="14" width="32" height="26" rx="6" fill="#8B5CF6" fillOpacity="0.25" stroke="#8B5CF6" strokeWidth="3" />
      <path d="M16 14V11C16 9.89543 16.8954 9 18 9H30C31.1046 9 32 9.89543 32 11V14" stroke="#8B5CF6" strokeWidth="3" />
      <path d="M24 32V20M24 20L19 25M24 20L29 25" stroke="#06B6D4" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeRoadmap, setActiveRoadmap] = useState('Data Science');
  const [bookmarkedCourses, setBookmarkedCourses] = useState<number[]>([1]);
  const [showAllRoadmaps, setShowAllRoadmaps] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Toggle course favorite
  const toggleBookmark = (id: number) => {
    setBookmarkedCourses((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Top Courses Data
  const topCourses = [
    {
      id: 1,
      title: 'Mastering Effective Communication Skills',
      bestseller: true,
      category: 'UI DESIGN',
      categorySlug: 'ui-ux',
      instructor: 'David Miller',
      avatar: '/images/avatar_1.jpg',
      image: '/images/course_comm.jpg',
      rating: 5.0,
      reviews: '2.1k Reviews',
      price: 'Rp150.000',
      oldPrice: 'Rp250.000',
      lessons: '12 Lessons',
      duration: '3.5 hrs',
      level: 'All Level',
      sale: true,
    },
    {
      id: 2,
      title: 'Become a Great Negotiator & Lead Your Business',
      bestseller: true,
      category: 'BUSINESS',
      categorySlug: 'business',
      instructor: 'Sarah Walker',
      avatar: '/images/avatar_2.jpg',
      image: '/images/course_negotiate.jpg',
      rating: 5.0,
      reviews: '1.8k Reviews',
      price: 'Rp180.000',
      oldPrice: 'Rp300.000',
      lessons: '15 Lessons',
      duration: '4 hrs',
      level: 'Intermediate',
      sale: true,
    },
    {
      id: 3,
      title: 'Time Management 101: Hacks for Maximum Productivity',
      bestseller: false,
      category: 'LIFESTYLE',
      categorySlug: 'lifestyle',
      instructor: 'Alex Johnson',
      avatar: '/images/avatar_3.jpg',
      image: '/images/course_clock.jpg',
      rating: 5.0,
      reviews: '950 Reviews',
      price: 'Rp120.000',
      oldPrice: 'Rp200.000',
      lessons: '8 Lessons',
      duration: '2.5 hrs',
      level: 'Beginner',
      sale: true,
    },
    {
      id: 4,
      title: 'Sentiment Analysis with Deep Learning using NLP',
      bestseller: false,
      category: 'AI TECH',
      categorySlug: 'development',
      instructor: 'Prof. Ryan Chen',
      avatar: '/images/avatar_4.jpg',
      image: '/images/course_nlp.jpg',
      rating: 5.0,
      reviews: '3.4k Reviews',
      price: 'Rp210.000',
      oldPrice: 'Rp350.000',
      lessons: '24 Lessons',
      duration: '8.5 hrs',
      level: 'Advanced',
      sale: true,
    },
  ];

  // Filtered courses based on category tab & search query
  const filteredCourses = useMemo(() => {
    return topCourses.filter((course) => {
      const matchCat =
        selectedCategory === 'all' || course.categorySlug === selectedCategory;
      const matchSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Roadmaps list
  const initialRoadmaps = [
    'User Interface Designer',
    'User Experience Designer',
    'Product Designer',
    'Digital Marketing',
    'React Front-End Developer',
    'Front-End App Developer',
    'Data Science',
    'Software Engineering',
    'Business Intelligence Developer',
    'Cyber Security',
    'Database Administrator',
  ];

  const extendedRoadmaps = [
    ...initialRoadmaps,
    'Cloud Solutions Architect',
    'DevOps & Kubernetes Engineer',
    'Mobile Flutter Specialist',
    'AI & Machine Learning Engineer',
  ];

  const displayedRoadmaps = showAllRoadmaps ? extendedRoadmaps : initialRoadmaps;

  return (
    <div className={styles.pageWrapper}>
      {/* ── Top Integration Notice (Connecting Sinsu & School OS) ── */}
      <div className={styles.topAnnouncement}>
        <span className={styles.portalBadge}>SCHOOL OS INTEGRATED</span>
        <span>
          Akses portal sekolah terintegrasi Dapodik Kemendikbud &amp; e-Rapor Kurikulum Merdeka.
        </span>
        <Link href="/dashboard" className={styles.portalLink}>
          Buka Dashboard Sekolah →
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════
          1. NAVIGATION HEADER
          ══════════════════════════════════════════════════════════ */}
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerInner}>
            <div className={styles.leftNavArea}>
              {/* Brand Logo */}
              <Link href="/" className={styles.logoGroup}>
                <SinsuBrandLogo size={34} />
                <span className={styles.logoText}>Sinsu</span>
              </Link>

              {/* Search Bar */}
              <div className={styles.searchBarWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="What do you want to learn?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {/* Nav Items */}
              <nav>
                <ul className={styles.navMenu}>
                  <li>
                    <span className={styles.navItem}>
                      Category <ChevronDown size={14} />
                    </span>
                  </li>
                  <li>
                    <span className={styles.navItem}>
                      Become an Instructor
                      <span className={styles.proBadge}>PRO</span>
                    </span>
                  </li>
                  <li>
                    <span className={styles.navItem}>Enterprise</span>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Right Nav Actions */}
            <div className={styles.headerActions}>
              <button className={styles.langSelector} aria-label="Select Language">
                <Globe size={15} />
                <span>EN</span>
                <ChevronDown size={13} />
              </button>

              <button className={styles.cartButton} aria-label="Bookmarked Courses">
                <Bookmark size={18} />
                <span className={styles.cartBadge}>{bookmarkedCourses.length}</span>
              </button>

              <Link href="/login" className={styles.signInBtn}>
                Sign In
              </Link>

              <Link href="/login" className={styles.joinFreeBtn}>
                Join for Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ══════════════════════════════════════════════════════════
            2. HERO SECTION
            ══════════════════════════════════════════════════════════ */}
        <section className={styles.heroSection}>
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div className={styles.heroContent}>
                <h1 className={styles.heroHeading}>
                  Upgrade your skills
                  <br />
                  for better future
                </h1>
                <div className={styles.heroIndicator}>
                  <div className={styles.indicatorBarActive} />
                  <div className={styles.indicatorDot} />
                  <div className={styles.indicatorDot} />
                </div>
              </div>

              <div className={styles.heroVisual}>
                <div className={styles.heroImageContainer}>
                  <Image
                    src="/images/hero_student.jpg"
                    alt="Student upgrading skills"
                    width={540}
                    height={420}
                    priority
                    className={styles.heroImage}
                    style={{ width: '100%', height: 'auto' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            3. RECOMMENDATION COURSE FOR YOU
            ══════════════════════════════════════════════════════════ */}
        <section className={styles.recommendationSection}>
          <div className={styles.container}>
            <div className={styles.recGrid}>
              {/* Left Column */}
              <div className={styles.recLeftCol}>
                <h2 className={styles.recHeading}>
                  Recommendation
                  <br />
                  course for you
                </h2>
                <p className={styles.recSubtext}>Stay learn anytime anywhere!</p>
                <a href="#discover-top-courses" className={styles.recAllBtn}>
                  <span>All Recommendation</span>
                  <ArrowRight size={15} />
                </a>
              </div>

              {/* Right Course Cards */}
              <div className={styles.recCarouselContainer}>
                <div className={styles.recCardsList}>
                  {/* Card 1 */}
                  <div className={styles.recCard}>
                    <div className={styles.recThumbWrapper}>
                      <Image
                        src="/images/rec_mgmt.jpg"
                        alt="Management & Leadership"
                        width={300}
                        height={160}
                        className={styles.recThumb}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <h3 className={styles.recCardTitle}>
                      Management &amp; Leadership: Effective Learning Skills
                    </h3>
                    <span className={styles.freeCourseBadge}>Free course</span>
                  </div>

                  {/* Card 2 */}
                  <div className={styles.recCard}>
                    <div className={styles.recThumbWrapper}>
                      <Image
                        src="/images/rec_coding.jpg"
                        alt="Basic Language Programming"
                        width={300}
                        height={160}
                        className={styles.recThumb}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <h3 className={styles.recCardTitle}>
                      Basic Language Programming Java &amp; JavaScript
                    </h3>
                    <span className={styles.freeCourseBadge}>Free course</span>
                  </div>

                  {/* Card 3 */}
                  <div className={styles.recCard}>
                    <div className={styles.recThumbWrapper}>
                      <Image
                        src="/images/rec_html.jpg"
                        alt="HTML5 Foundation Layout"
                        width={300}
                        height={160}
                        className={styles.recThumb}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <h3 className={styles.recCardTitle}>
                      Basic to Intermediate HTML5 form Foundation Layout
                    </h3>
                    <span className={styles.freeCourseBadge}>Free course</span>
                  </div>
                </div>

                {/* Floating Next Button */}
                <button
                  className={styles.recFloatingNextBtn}
                  aria-label="Next recommendations"
                  onClick={() => alert('Menampilkan rekomendasi kursus lainnya')}
                >
                  <ChevronRight size={22} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            4. WHY SINSU? (Features Grid)
            ══════════════════════════════════════════════════════════ */}
        <section className={styles.whySection}>
          <div className={styles.container}>
            <h2 className={styles.whyHeading}>Why Sinsu?</h2>

            <div className={styles.whyGrid}>
              {/* Feature 1 */}
              <div className={styles.whyItem}>
                <div className={styles.whyIconBox}>
                  <LearnAnywhereIcon />
                </div>
                <h3 className={styles.whyItemTitle}>Learn anything, anywhere</h3>
                <p className={styles.whyItemText}>
                  Learn from expert tutors and mentors anywhere and anytime you want.
                </p>
              </div>

              {/* Feature 2 */}
              <div className={styles.whyItem}>
                <div className={styles.whyIconBox}>
                  <CaseStudiesIcon />
                </div>
                <h3 className={styles.whyItemTitle}>Case Studies</h3>
                <p className={styles.whyItemText}>
                  Real life case studies to ensure you understand the material practically.
                </p>
              </div>

              {/* Feature 3 */}
              <div className={styles.whyItem}>
                <div className={styles.whyIconBox}>
                  <DiscussionGroupIcon />
                </div>
                <h3 className={styles.whyItemTitle}>Discussion Group</h3>
                <p className={styles.whyItemText}>
                  Join discussion groups to interact with fellow students and instructors.
                </p>
              </div>

              {/* Feature 4 */}
              <div className={styles.whyItem}>
                <div className={styles.whyIconBox}>
                  <ScheduleMentorIcon />
                </div>
                <h3 className={styles.whyItemTitle}>Schedule with mentor</h3>
                <p className={styles.whyItemText}>
                  Schedule 1-on-1 sessions with mentors to discuss learning paths and progress.
                </p>
              </div>

              {/* Feature 5 */}
              <div className={styles.whyItem}>
                <div className={styles.whyIconBox}>
                  <CertificateIcon />
                </div>
                <h3 className={styles.whyItemTitle}>Certificate</h3>
                <p className={styles.whyItemText}>
                  Earn accredited certificates upon completion to showcase your achievements.
                </p>
              </div>

              {/* Feature 6 */}
              <div className={styles.whyItem}>
                <div className={styles.whyIconBox}>
                  <UploadPortfolioIcon />
                </div>
                <h3 className={styles.whyItemTitle}>Upload Portfolio</h3>
                <p className={styles.whyItemText}>
                  Build a standout portfolio showcasing projects and skills learned.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            5. DISCOVER TOP COURSE
            ══════════════════════════════════════════════════════════ */}
        <section id="discover-top-courses" className={styles.topCourseSection}>
          <div className={styles.container}>
            <h2 className={styles.topCourseHeading}>Discover Top Course</h2>

            {/* Category Filter Tabs */}
            <div className={styles.categoryTabsBar}>
              {[
                { label: 'All Categories', slug: 'all' },
                { label: 'Development', slug: 'development' },
                { label: 'UI/UX Design', slug: 'ui-ux' },
                { label: 'Design', slug: 'design' },
                { label: 'Business', slug: 'business' },
                { label: 'Lifestyle', slug: 'lifestyle' },
                { label: 'Marketing', slug: 'marketing' },
              ].map((tab) => (
                <button
                  key={tab.slug}
                  onClick={() => setSelectedCategory(tab.slug)}
                  className={`${styles.categoryTabItem} ${
                    selectedCategory === tab.slug ? styles.categoryTabItemActive : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Courses Grid */}
            <div className={styles.courseGrid}>
              {filteredCourses.map((course) => {
                const isBookmarked = bookmarkedCourses.includes(course.id);
                return (
                  <div key={course.id} className={styles.courseCard}>
                    {/* Media */}
                    <div className={styles.courseMedia}>
                      <Image
                        src={course.image}
                        alt={course.title}
                        width={320}
                        height={180}
                        className={styles.courseCoverImg}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {course.bestseller && (
                        <span className={styles.bestsellerBadge}>Bestseller</span>
                      )}

                      <button
                        onClick={() => toggleBookmark(course.id)}
                        className={`${styles.heartBtn} ${
                          isBookmarked ? styles.heartBtnActive : ''
                        }`}
                        aria-label="Add to wishlist"
                      >
                        <Heart
                          size={16}
                          fill={isBookmarked ? '#EF4444' : 'none'}
                          color={isBookmarked ? '#EF4444' : '#64748B'}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className={styles.courseContent}>
                      <h3 className={styles.courseTitle}>{course.title}</h3>

                      <div className={styles.instructorRow}>
                        <Image
                          src={course.avatar}
                          alt={course.instructor}
                          width={24}
                          height={24}
                          className={styles.instructorAvatar}
                        />
                        <span>{course.instructor}</span>
                      </div>

                      <div className={styles.ratingRow}>
                        <div className={styles.starsGroup}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={13} fill="#F59E0B" stroke="#F59E0B" />
                          ))}
                        </div>
                        <span className={styles.reviewCountText}>({course.reviews})</span>
                      </div>

                      <div className={styles.priceRow}>
                        <span className={styles.currentPrice}>{course.price}</span>
                        <span className={styles.originalPrice}>{course.oldPrice}</span>
                      </div>

                      <div className={styles.metaInfoRow}>
                        <div className={styles.metaInfoItem}>
                          <BookOpen size={13} />
                          <span>{course.lessons}</span>
                        </div>
                        <div className={styles.metaInfoItem}>
                          <Clock size={13} />
                          <span>{course.duration}</span>
                        </div>
                      </div>

                      <div className={styles.tagsRow}>
                        <span className={styles.categoryTag}>{course.category}</span>
                        {course.sale && <span className={styles.saleTag}>Sale</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carousel Bottom Controls */}
            <div className={styles.carouselBottomControls}>
              <div className={styles.sliderIndicatorGroup}>
                <div className={styles.sliderBarActive} />
                <div className={styles.sliderDot} />
                <div className={styles.sliderDot} />
                <div className={styles.sliderDot} />
              </div>

              <div className={styles.sliderNavButtons}>
                <button
                  className={styles.sliderArrowBtnOutline}
                  aria-label="Previous courses"
                  onClick={() => alert('Slide sebelumnya')}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className={styles.sliderArrowBtnFilled}
                  aria-label="Next courses"
                  onClick={() => alert('Slide berikutnya')}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            6. UNLOCK SOMETHING NEW SKILL
            ══════════════════════════════════════════════════════════ */}
        <section className={styles.unlockSection}>
          <div className={styles.container}>
            <h2 className={styles.unlockHeading}>Unlock Something New Skill</h2>

            <div className={styles.unlockGrid}>
              {/* Masterclass 1 */}
              <div className={styles.masterclassCard}>
                <div className={styles.masterclassThumbWrap}>
                  <Image
                    src="/images/masterclass_comm.jpg"
                    alt="Communication Masterclass"
                    width={400}
                    height={220}
                    className={styles.masterclassThumb}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.masterclassBody}>
                  <h3 className={styles.masterclassTitle}>
                    The Communication Skills and Practical Intelligence Masterclass
                  </h3>

                  <div className={styles.masterclassRatingRow}>
                    <div className={styles.starsGroup}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />
                      ))}
                    </div>
                    <span>4.9 (1.2k reviews)</span>
                  </div>

                  <p className={styles.masterclassMetaText}>
                    12 Lessons • 3 hrs • Beginner
                  </p>

                  <div className={styles.masterclassBottomRow}>
                    <div className={styles.masterclassPriceBox}>
                      <span className={styles.masterclassPrice}>Rp160.000</span>
                      <span className={styles.masterclassOldPrice}>Rp300.000</span>
                    </div>
                    <button
                      className={styles.enrollBtn}
                      onClick={() => alert('Mendaftar ke The Communication Skills Masterclass!')}
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Masterclass 2 */}
              <div className={styles.masterclassCard}>
                <div className={styles.masterclassThumbWrap}>
                  <Image
                    src="/images/masterclass_filmmaking.jpg"
                    alt="Visual Storytelling"
                    width={400}
                    height={220}
                    className={styles.masterclassThumb}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.masterclassBody}>
                  <h3 className={styles.masterclassTitle}>
                    Visual Storytelling: Filmmaking Guide to Publish Your Stories
                  </h3>

                  <div className={styles.masterclassRatingRow}>
                    <div className={styles.starsGroup}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />
                      ))}
                    </div>
                    <span>4.9 (850 reviews)</span>
                  </div>

                  <p className={styles.masterclassMetaText}>
                    18 Lessons • 5 hrs • All Level
                  </p>

                  <div className={styles.masterclassBottomRow}>
                    <div className={styles.masterclassPriceBox}>
                      <span className={styles.masterclassPrice}>Rp190.000</span>
                      <span className={styles.masterclassOldPrice}>Rp350.000</span>
                    </div>
                    <button
                      className={styles.enrollBtn}
                      onClick={() => alert('Mendaftar ke Visual Storytelling Masterclass!')}
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Masterclass 3 */}
              <div className={styles.masterclassCard}>
                <div className={styles.masterclassThumbWrap}>
                  <Image
                    src="/images/masterclass_english.jpg"
                    alt="English Conversation"
                    width={400}
                    height={220}
                    className={styles.masterclassThumb}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.masterclassBody}>
                  <h3 className={styles.masterclassTitle}>
                    English Conversation: Learn Daily spoken English for speaking and listening
                  </h3>

                  <div className={styles.masterclassRatingRow}>
                    <div className={styles.starsGroup}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />
                      ))}
                    </div>
                    <span>4.8 (2.4k reviews)</span>
                  </div>

                  <p className={styles.masterclassMetaText}>
                    20 Lessons • 6.5 hrs • Any
                  </p>

                  <div className={styles.masterclassBottomRow}>
                    <div className={styles.masterclassPriceBox}>
                      <span className={styles.masterclassPrice}>Rp140.000</span>
                      <span className={styles.masterclassOldPrice}>Rp280.000</span>
                    </div>
                    <button
                      className={styles.enrollBtn}
                      onClick={() => alert('Mendaftar ke English Conversation Masterclass!')}
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            7. DUAL PROMO BANNER CARDS (Side-by-Side)
            ══════════════════════════════════════════════════════════ */}
        <section className={styles.promoSection}>
          <div className={styles.container}>
            <div className={styles.promoGrid}>
              {/* Promo Card 1 */}
              <div className={styles.promoCard}>
                <div>
                  <span className={styles.promoCardTag}>NEW COURSE</span>
                  <h3 className={styles.promoCardTitle}>
                    Looking for your next course? Find out content here
                  </h3>
                </div>
                <button
                  className={styles.promoActionBtn}
                  onClick={() => {
                    const el = document.getElementById('discover-top-courses');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Find Out Course
                </button>
              </div>

              {/* Promo Card 2 */}
              <div className={styles.promoCard}>
                <div>
                  <span className={styles.promoCardTag}>PROJECT</span>
                  <h3 className={styles.promoCardTitle}>
                    Explore real projects to create, and the support of fellow member
                  </h3>
                </div>
                <button
                  className={styles.promoActionBtn}
                  onClick={() => alert('Membuka kurasi portofolio & proyek kolaborasi!')}
                >
                  Explore Project
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            8. DISCOVER ROADMAP FOR CAREER
            ══════════════════════════════════════════════════════════ */}
        <section className={styles.roadmapSection}>
          <div className={styles.container}>
            <h2 className={styles.roadmapHeading}>Discover Roadmap for Career</h2>
            <p className={styles.roadmapSubtext}>Find your roadmaps</p>

            <div className={styles.roadmapPillsList}>
              {displayedRoadmaps.map((career) => {
                const isActive = activeRoadmap === career;
                return (
                  <button
                    key={career}
                    onClick={() => setActiveRoadmap(career)}
                    className={`${styles.roadmapPill} ${
                      isActive ? styles.roadmapPillActive : ''
                    }`}
                  >
                    <span>{career}</span>
                    <span className={styles.roadmapArrow}>→</span>
                  </button>
                );
              })}

              <button
                onClick={() => setShowAllRoadmaps(!showAllRoadmaps)}
                className={styles.showMorePill}
              >
                <span>{showAllRoadmaps ? 'Show Less -' : 'Show More +'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            9. EXPLORE MEMBER REVIEWS
            ══════════════════════════════════════════════════════════ */}
        <section className={styles.reviewsSection}>
          <div className={styles.container}>
            <h2 className={styles.reviewsHeading}>Explore Member Reviews</h2>

            <div className={styles.reviewsGrid}>
              {/* Review 1 */}
              <div className={styles.reviewItem}>
                <p className={styles.reviewQuote}>
                  &ldquo;This course has been such an eye-opener on NLP and sequential
                  models! The instructor breaks down complex and advanced deep learning
                  architectures for sequences and NLP. The most difficult concepts are
                  broken down and explained well. Essential for every aspiring NLP expert
                  - also enjoyed the practical coding exercises; they really put
                  everything together.&rdquo;
                </p>
                <div className={styles.reviewAuthorRow}>
                  <div className={styles.reviewAuthorInfo}>
                    <span className={styles.reviewAuthorName}>Diamond Howard</span>
                    <span className={styles.reviewAuthorRole}>
                      NLP Engineer Aspirant • 3 months of learning
                    </span>
                  </div>
                  <div className={styles.reviewStars}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Review 2 */}
              <div className={styles.reviewItem}>
                <p className={styles.reviewQuote}>
                  &ldquo;The mentor is cool, the way he conveys each material is also
                  detailed and easy to reach!&rdquo;
                </p>
                <div className={styles.reviewAuthorRow}>
                  <div className={styles.reviewAuthorInfo}>
                    <span className={styles.reviewAuthorName}>Dean Evans</span>
                    <span className={styles.reviewAuthorRole}>
                      Junior Frontend Developer at Megatech
                    </span>
                  </div>
                  <div className={styles.reviewStars}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Review 3 */}
              <div className={styles.reviewItem}>
                <p className={styles.reviewQuote}>
                  &ldquo;I love the form of classes which include real cases &amp; assignments,
                  which keep me engaged and to train after the free courses.&rdquo;
                </p>
                <div className={styles.reviewAuthorRow}>
                  <div className={styles.reviewAuthorInfo}>
                    <span className={styles.reviewAuthorName}>Gretchen Sharples</span>
                    <span className={styles.reviewAuthorRole}>
                      AI Specialist at Analytic Systems
                    </span>
                  </div>
                  <div className={styles.reviewStars}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Review 4 */}
              <div className={styles.reviewItem}>
                <p className={styles.reviewQuote}>
                  &ldquo;Easy to understand and very straight forward.&rdquo;
                </p>
                <div className={styles.reviewAuthorRow}>
                  <div className={styles.reviewAuthorInfo}>
                    <span className={styles.reviewAuthorName}>Graham Fox</span>
                    <span className={styles.reviewAuthorRole}>
                      Graphic Designer at Creative Studio
                    </span>
                  </div>
                  <div className={styles.reviewStars}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />
                    ))}
                  </div>
                </div>
              </div>

              {showAllReviews && (
                <>
                  <div className={styles.reviewItem}>
                    <p className={styles.reviewQuote}>
                      &ldquo;Materi yang disampaikan sangat runtut, langsung ke studi kasus
                      industri nyata. Dalam 2 bulan saya berhasil membuat 3 proyek
                      portfolio lengkap.&rdquo;
                    </p>
                    <div className={styles.reviewAuthorRow}>
                      <div className={styles.reviewAuthorInfo}>
                        <span className={styles.reviewAuthorName}>Siti Rahma</span>
                        <span className={styles.reviewAuthorRole}>
                          Fullstack Web Developer
                        </span>
                      </div>
                      <div className={styles.reviewStars}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.reviewItem}>
                    <p className={styles.reviewQuote}>
                      &ldquo;Sistem mentorship sangat membantu saat ada kendala kode atau
                      arsitektur. Sangat recommended bagi pemula maupun professional.&rdquo;
                    </p>
                    <div className={styles.reviewAuthorRow}>
                      <div className={styles.reviewAuthorInfo}>
                        <span className={styles.reviewAuthorName}>Budi Setiawan</span>
                        <span className={styles.reviewAuthorRole}>
                          Cloud DevOps Architect
                        </span>
                      </div>
                      <div className={styles.reviewStars}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={styles.readMoreContainer}>
              <button
                className={styles.readMoreBtn}
                onClick={() => setShowAllReviews(!showAllReviews)}
              >
                {showAllReviews ? 'Show Less' : 'Read More'}
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            10. JOIN OVER 10,000 LEARNERS BANNER
            ══════════════════════════════════════════════════════════ */}
        <section className={styles.joinSection}>
          <div className={styles.container}>
            <div className={styles.joinBannerCard}>
              <div className={styles.joinBannerLeft}>
                <h2 className={styles.joinBannerTitle}>
                  Join over <span className={styles.joinBannerHighlight}>10,000</span>
                  <br />
                  learners worldwide
                </h2>
                <Link href="/login" className={styles.registerNowBtn}>
                  Register Now
                </Link>
              </div>

              <div className={styles.joinBannerRight}>
                <Image
                  src="/images/join_student.jpg"
                  alt="Student celebration"
                  width={540}
                  height={340}
                  className={styles.joinBannerImg}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════
          11. GLOBAL DARK FOOTER
          ══════════════════════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            {/* Column 1: Brand */}
            <div className={styles.footerColBrand}>
              <div className={styles.footerLogo}>
                <SinsuBrandLogo size={28} />
                <span className={styles.footerLogoText}>Sinsu</span>
              </div>
              <p className={styles.footerBrandDesc}>
                Sinsu is a global education learning platform that helps anyone,
                anywhere learn skills to transform their career.
              </p>
              <button className={styles.footerLangBtn}>
                <Globe size={15} />
                <span>English</span>
                <ChevronDown size={13} />
              </button>
            </div>

            {/* Column 2: Links */}
            <div>
              <h4 className={styles.footerColTitle}>Links</h4>
              <ul className={styles.footerLinksList}>
                <li><a href="#about" className={styles.footerLinkItem}>About</a></li>
                <li><a href="#careers" className={styles.footerLinkItem}>Careers</a></li>
                <li><a href="#teach" className={styles.footerLinkItem}>Teach on Sinsu</a></li>
                <li><a href="#contact" className={styles.footerLinkItem}>Contact Us</a></li>
                <li><a href="#terms" className={styles.footerLinkItem}>Terms</a></li>
                <li><a href="#privacy" className={styles.footerLinkItem}>Privacy</a></li>
              </ul>
            </div>

            {/* Column 3: Community */}
            <div>
              <h4 className={styles.footerColTitle}>Community</h4>
              <ul className={styles.footerLinksList}>
                <li><a href="#learners" className={styles.footerLinkItem}>Learners</a></li>
                <li><a href="#partners" className={styles.footerLinkItem}>Partners</a></li>
                <li><a href="#developers" className={styles.footerLinkItem}>Developers</a></li>
                <li><a href="#transactions" className={styles.footerLinkItem}>Transactions</a></li>
                <li><a href="#blog" className={styles.footerLinkItem}>Blog</a></li>
                <li><a href="#teaching-center" className={styles.footerLinkItem}>Teaching Center</a></li>
              </ul>
            </div>

            {/* Column 4: More */}
            <div>
              <h4 className={styles.footerColTitle}>More</h4>
              <ul className={styles.footerLinksList}>
                <li><a href="#faq" className={styles.footerLinkItem}>FAQ</a></li>
                <li><a href="#help" className={styles.footerLinkItem}>Help Center</a></li>
                <li><a href="#terms" className={styles.footerLinkItem}>Terms</a></li>
                <li><a href="#privacy" className={styles.footerLinkItem}>Privacy</a></li>
                <li><a href="#services" className={styles.footerLinkItem}>Contact Services</a></li>
                <li><a href="#cookie" className={styles.footerLinkItem}>Cookie Booths</a></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom Row */}
          <div className={styles.footerBottomRow}>
            <div className={styles.socialIconsList}>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className={styles.socialIconBtn} aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.54a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24Z" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className={styles.socialIconBtn} aria-label="Twitter">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className={styles.socialIconBtn} aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className={styles.socialIconBtn} aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2v3.98h2v8.01z" />
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className={styles.socialIconBtn} aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>

            <p className={styles.copyrightText}>
              &copy; 2026 Sinsu Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
