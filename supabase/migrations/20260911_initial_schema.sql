-- Author: Adrian Roy Williams
-- Description: PAIMANA Framework Database Schema and RLS Policies

-- Create custom types
CREATE TYPE user_role AS ENUM ('nodal_officer', 'ministry_analyst', 'apex_decision_maker');
CREATE TYPE bottleneck_severity AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE bottleneck_status AS ENUM ('Pending', 'Resolved');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    state TEXT NOT NULL,
    implementing_agency TEXT NOT NULL,
    sanctioned_cost_cr NUMERIC NOT NULL,
    latest_revised_cost_cr NUMERIC NOT NULL,
    status TEXT NOT NULL,
    is_mega_project BOOLEAN GENERATED ALWAYS AS (latest_revised_cost_cr > 500) STORED,
    assigned_nodal_officer UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Project Progress table
CREATE TABLE project_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    reporting_period DATE NOT NULL,
    physical_progress_pct NUMERIC NOT NULL,
    financial_progress_pct NUMERIC NOT NULL,
    schedule_slip_months NUMERIC NOT NULL,
    land_acquisition_delay_flag BOOLEAN DEFAULT FALSE,
    monsoon_disruption_index NUMERIC DEFAULT 0,
    contractor_track_record_score NUMERIC DEFAULT 0,
    risk_reasons TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Project Bottlenecks table
CREATE TABLE project_bottlenecks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    bottleneck_type TEXT NOT NULL,
    status bottleneck_status NOT NULL,
    severity bottleneck_severity NOT NULL,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Project Predictions table
CREATE TABLE project_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    predicted_cost_overrun_pct NUMERIC NOT NULL,
    predicted_schedule_slip_months NUMERIC NOT NULL,
    isolation_forest_anomaly_score NUMERIC NOT NULL,
    is_anomalous_bottleneck BOOLEAN NOT NULL,
    risk_score NUMERIC NOT NULL,
    risk_band TEXT NOT NULL,
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_bottlenecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_predictions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- Nodal Officer: Can view and edit assigned projects and their related data
CREATE POLICY "Nodal Officers view assigned projects" ON projects FOR SELECT 
USING (assigned_nodal_officer = auth.uid());

CREATE POLICY "Nodal Officers edit assigned projects" ON projects FOR UPDATE 
USING (assigned_nodal_officer = auth.uid());

CREATE POLICY "Nodal Officers view progress of assigned projects" ON project_progress FOR SELECT 
USING (project_id IN (SELECT id FROM projects WHERE assigned_nodal_officer = auth.uid()));

CREATE POLICY "Nodal Officers insert progress for assigned projects" ON project_progress FOR INSERT 
WITH CHECK (project_id IN (SELECT id FROM projects WHERE assigned_nodal_officer = auth.uid()));

CREATE POLICY "Nodal Officers update progress for assigned projects" ON project_progress FOR UPDATE 
USING (project_id IN (SELECT id FROM projects WHERE assigned_nodal_officer = auth.uid()));

CREATE POLICY "Nodal Officers view bottlenecks of assigned projects" ON project_bottlenecks FOR SELECT 
USING (project_id IN (SELECT id FROM projects WHERE assigned_nodal_officer = auth.uid()));

CREATE POLICY "Nodal Officers insert bottlenecks for assigned projects" ON project_bottlenecks FOR INSERT 
WITH CHECK (project_id IN (SELECT id FROM projects WHERE assigned_nodal_officer = auth.uid()));

CREATE POLICY "Nodal Officers update bottlenecks for assigned projects" ON project_bottlenecks FOR UPDATE 
USING (project_id IN (SELECT id FROM projects WHERE assigned_nodal_officer = auth.uid()));

CREATE POLICY "Nodal Officers view predictions of assigned projects" ON project_predictions FOR SELECT 
USING (project_id IN (SELECT id FROM projects WHERE assigned_nodal_officer = auth.uid()));

-- Ministry Analyst: Can view all projects and related data
CREATE POLICY "Ministry Analysts view all projects" ON projects FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ministry_analyst'));

CREATE POLICY "Ministry Analysts view all progress" ON project_progress FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ministry_analyst'));

CREATE POLICY "Ministry Analysts view all bottlenecks" ON project_bottlenecks FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ministry_analyst'));

CREATE POLICY "Ministry Analysts view all predictions" ON project_predictions FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ministry_analyst'));

-- Apex Decision Maker: Can view only mega projects and their related data
CREATE POLICY "Apex PMG view mega projects" ON projects FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'apex_decision_maker') AND is_mega_project = true);

CREATE POLICY "Apex PMG view progress for mega projects" ON project_progress FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'apex_decision_maker') AND project_id IN (SELECT id FROM projects WHERE is_mega_project = true));

CREATE POLICY "Apex PMG view bottlenecks for mega projects" ON project_bottlenecks FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'apex_decision_maker') AND project_id IN (SELECT id FROM projects WHERE is_mega_project = true));

CREATE POLICY "Apex PMG view predictions for mega projects" ON project_predictions FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'apex_decision_maker') AND project_id IN (SELECT id FROM projects WHERE is_mega_project = true));
