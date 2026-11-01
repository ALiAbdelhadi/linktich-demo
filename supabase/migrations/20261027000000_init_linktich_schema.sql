-- ==============================================================================
-- Linktich B2B2C SaaS Platform - Initial Database Schema Migration
-- Dialect: PostgreSQL 15+ / Supabase
-- Target Region: Egypt (Tutoring Centers, Teachers, Students)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. ENUM DEFINITIONS
-- ------------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'CENTER',
    'TEACHER',
    'STUDENT'
);

CREATE TYPE subscription_status AS ENUM (
    'TRIALING',
    'ACTIVE',
    'PAST_DUE',
    'CANCELED',
    'UNPAID',
    'EXPIRED',
    'INACTIVE'
);

CREATE TYPE subscription_plan AS ENUM (
    'FREE_TRIAL',
    'CENTER_BASIC_MONTHLY',
    'CENTER_BASIC_YEARLY',
    'CENTER_PRO_MONTHLY',
    'CENTER_PRO_YEARLY',
    'CENTER_ENTERPRISE',
    'TEACHER_BASIC_MONTHLY',
    'TEACHER_BASIC_YEARLY',
    'TEACHER_PRO_MONTHLY',
    'TEACHER_PRO_YEARLY'
);

CREATE TYPE relation_status AS ENUM (
    'PENDING',
    'ACTIVE',
    'INACTIVE',
    'TERMINATED'
);

CREATE TYPE billing_cycle AS ENUM (
    'PER_SESSION',
    'MONTHLY'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE',
    'REFUNDED',
    'EXEMPT'
);

CREATE TYPE attendance_status AS ENUM (
    'REGISTERED',
    'REGULAR',
    'AT_RISK',
    'DROPPED'
);

CREATE TYPE session_attendance_status AS ENUM (
    'PRESENT',
    'ABSENT',
    'LATE',
    'EXCUSED'
);

-- ------------------------------------------------------------------------------
-- 3. TRIGGER FUNCTION FOR UPDATED_AT TIMESTAMP
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 4. TABLE CREATION
-- ------------------------------------------------------------------------------

-- Table: Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL DEFAULT 'STUDENT',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Constraints
    CONSTRAINT chk_users_phone_not_empty CHECK (length(trim(phone)) >= 9)
);

-- Table: Centers (B2B SaaS Subscriber)
CREATE TABLE centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subscription_status subscription_status NOT NULL DEFAULT 'TRIALING',
    subscription_plan subscription_plan NOT NULL DEFAULT 'FREE_TRIAL',
    subscription_current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: Teachers (B2B/B2C SaaS Subscriber)
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(120) NOT NULL,
    bio TEXT,
    subscription_status subscription_status NOT NULL DEFAULT 'TRIALING',
    subscription_plan subscription_plan NOT NULL DEFAULT 'FREE_TRIAL',
    subscription_current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: Center_Teacher_Relation (Many-to-Many Bridge Table)
CREATE TABLE center_teacher_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    status relation_status NOT NULL DEFAULT 'ACTIVE',
    commission_rate NUMERIC(5, 2) DEFAULT 0.00,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Constraints
    CONSTRAINT uq_center_teacher UNIQUE (center_id, teacher_id),
    CONSTRAINT chk_commission_rate CHECK (commission_rate >= 0.00 AND commission_rate <= 100.00)
);

-- Table: Classes / Courses (Educational Groups)
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES centers(id) ON DELETE RESTRICT,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    billing_cycle billing_cycle NOT NULL DEFAULT 'MONTHLY',
    capacity INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Constraints
    CONSTRAINT chk_classes_price_positive CHECK (price >= 0.00),
    CONSTRAINT chk_classes_capacity_positive CHECK (capacity IS NULL OR capacity > 0)
);

-- Table: Enrollments (Students to Classes)
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    payment_status payment_status NOT NULL DEFAULT 'PENDING',
    attendance_status attendance_status NOT NULL DEFAULT 'REGISTERED',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Constraints
    CONSTRAINT uq_student_class UNIQUE (student_id, class_id)
);

-- Table: Session_Attendances (Daily Operations & Attendance Logs)
CREATE TABLE session_attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    status session_attendance_status NOT NULL DEFAULT 'PRESENT',
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    amount_paid NUMERIC(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Constraints
    CONSTRAINT uq_enrollment_session_date UNIQUE (enrollment_id, session_date)
);

-- ------------------------------------------------------------------------------
-- 5. INDEXES FOR PERFORMANCE OPTIMIZATION
-- ------------------------------------------------------------------------------

-- Users indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);

-- Centers indexes
CREATE INDEX idx_centers_owner_id ON centers(owner_id);
CREATE INDEX idx_centers_subscription_status ON centers(subscription_status);
CREATE INDEX idx_centers_location ON centers(location);

-- Teachers indexes
CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_subject ON teachers(subject);
CREATE INDEX idx_teachers_subscription_status ON teachers(subscription_status);

-- Center-Teacher Relation indexes
CREATE INDEX idx_ctr_center_id ON center_teacher_relations(center_id);
CREATE INDEX idx_ctr_teacher_id ON center_teacher_relations(teacher_id);
CREATE INDEX idx_ctr_status ON center_teacher_relations(status);

-- Classes indexes
CREATE INDEX idx_classes_center_id ON classes(center_id);
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_classes_is_active ON classes(is_active);
CREATE INDEX idx_classes_schedule_gin ON classes USING GIN (schedule);

-- Enrollments indexes
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX idx_enrollments_payment_status ON enrollments(payment_status);
CREATE INDEX idx_enrollments_attendance_status ON enrollments(attendance_status);

-- Session Attendance indexes
CREATE INDEX idx_sa_class_date ON session_attendances(class_id, session_date);
CREATE INDEX idx_sa_student_id ON session_attendances(student_id);
CREATE INDEX idx_sa_is_paid ON session_attendances(is_paid);

-- ------------------------------------------------------------------------------
-- 6. AUTOMATED UPDATED_AT TRIGGERS
-- ------------------------------------------------------------------------------

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_centers_updated_at BEFORE UPDATE ON centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_ctr_updated_at BEFORE UPDATE ON center_teacher_relations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_session_attendances_updated_at BEFORE UPDATE ON session_attendances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 7. ROW-LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_teacher_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendances ENABLE ROW LEVEL SECURITY;

-- Sample policy: Users can read their own profile
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Sample policy: Students can view classes they are enrolled in
CREATE POLICY "Students can view enrolled classes"
    ON classes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE enrollments.class_id = classes.id
              AND enrollments.student_id = auth.uid()
        )
    );
