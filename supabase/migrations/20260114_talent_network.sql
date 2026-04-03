-- Talent Network Feature
-- Enables users to manage their professional network with skills, referrals, and availability tracking

-- Skills taxonomy table (predefined list)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT, -- AI context about what this role typically does
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Talent contacts table
CREATE TABLE talent_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  photo_url TEXT,
  specialty_summary TEXT,
  working_style_notes TEXT,
  rate_min NUMERIC(10,2),
  rate_max NUMERIC(10,2),
  rate_type TEXT CHECK (rate_type IN ('hourly', 'daily', 'project')),
  trust_rating INTEGER CHECK (trust_rating >= 1 AND trust_rating <= 5),
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Junction table for many-to-many relationship between contacts and skills
CREATE TABLE talent_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_contact_id UUID REFERENCES talent_contacts(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(talent_contact_id, skill_id)
);

-- Referral tracking table
CREATE TABLE talent_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  talent_contact_id UUID REFERENCES talent_contacts(id) ON DELETE CASCADE NOT NULL,
  referred_date DATE NOT NULL,
  client_name TEXT,
  project_type TEXT,
  estimated_value NUMERIC(10,2),
  commission_fee NUMERIC(10,2),
  notes TEXT,
  follow_up_date DATE,
  outcome_delivered BOOLEAN,
  outcome_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Junction table linking talent contacts to opportunities
CREATE TABLE talent_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_contact_id UUID REFERENCES talent_contacts(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(talent_contact_id, opportunity_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_talent_contacts_user_id ON talent_contacts(user_id);
CREATE INDEX idx_talent_contacts_availability ON talent_contacts(availability_status);
CREATE INDEX idx_talent_skills_contact_id ON talent_skills(talent_contact_id);
CREATE INDEX idx_talent_skills_skill_id ON talent_skills(skill_id);
CREATE INDEX idx_talent_referrals_user_id ON talent_referrals(user_id);
CREATE INDEX idx_talent_referrals_contact_id ON talent_referrals(talent_contact_id);
CREATE INDEX idx_talent_opportunities_contact_id ON talent_opportunities(talent_contact_id);
CREATE INDEX idx_talent_opportunities_opportunity_id ON talent_opportunities(opportunity_id);

-- Enable Row Level Security
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Skills: readable by everyone (authenticated users), no write access (managed by admin)
CREATE POLICY "Skills are viewable by authenticated users"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

-- Talent contacts: users can only see and manage their own contacts
CREATE POLICY "Users can view their own talent contacts"
  ON talent_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own talent contacts"
  ON talent_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own talent contacts"
  ON talent_contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own talent contacts"
  ON talent_contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Talent skills: users can manage skills for their own contacts
CREATE POLICY "Users can view skills for their contacts"
  ON talent_skills FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM talent_contacts
      WHERE talent_contacts.id = talent_skills.talent_contact_id
      AND talent_contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add skills to their contacts"
  ON talent_skills FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM talent_contacts
      WHERE talent_contacts.id = talent_skills.talent_contact_id
      AND talent_contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove skills from their contacts"
  ON talent_skills FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM talent_contacts
      WHERE talent_contacts.id = talent_skills.talent_contact_id
      AND talent_contacts.user_id = auth.uid()
    )
  );

-- Talent referrals: users can only see and manage their own referrals
CREATE POLICY "Users can view their own talent referrals"
  ON talent_referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own talent referrals"
  ON talent_referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own talent referrals"
  ON talent_referrals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own talent referrals"
  ON talent_referrals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Talent opportunities: users can link contacts to their own opportunities
CREATE POLICY "Users can view talent-opportunity links for their contacts"
  ON talent_opportunities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM talent_contacts
      WHERE talent_contacts.id = talent_opportunities.talent_contact_id
      AND talent_contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can link talent to their opportunities"
  ON talent_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM talent_contacts
      WHERE talent_contacts.id = talent_opportunities.talent_contact_id
      AND talent_contacts.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM opportunities
      WHERE opportunities.id = talent_opportunities.opportunity_id
      AND opportunities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can unlink talent from their opportunities"
  ON talent_opportunities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM talent_contacts
      WHERE talent_contacts.id = talent_opportunities.talent_contact_id
      AND talent_contacts.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_talent_contacts_updated_at
  BEFORE UPDATE ON talent_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_talent_referrals_updated_at
  BEFORE UPDATE ON talent_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed predefined skills taxonomy
INSERT INTO skills (name, category, description) VALUES
  -- Design
  ('Product Design', 'Design', 'End-to-end product design including user research, wireframing, prototyping, and high-fidelity UI design for digital products'),
  ('UX Design', 'Design', 'User experience design focused on user research, information architecture, user flows, and interaction design'),
  ('UI Design', 'Design', 'User interface design specializing in visual design, design systems, and pixel-perfect screen designs'),
  ('Visual Design', 'Design', 'Graphic design for digital and print, including layouts, typography, color theory, and brand aesthetics'),
  ('Brand Design', 'Design', 'Brand identity creation including logos, brand guidelines, visual systems, and brand strategy'),
  ('Motion Design', 'Design', 'Animation and motion graphics for UI, marketing, and video content'),
  ('Illustration', 'Design', 'Custom illustrations for web, mobile, marketing, and editorial content'),
  ('3D Design', 'Design', '3D modeling, rendering, and animation for product visualization, games, or marketing'),

  -- Development
  ('Frontend Development', 'Development', 'Client-side web development using HTML, CSS, JavaScript, and modern frameworks like React, Vue, or Angular'),
  ('Backend Development', 'Development', 'Server-side development including APIs, databases, authentication, and business logic using Node.js, Python, Ruby, Java, etc.'),
  ('Full Stack Development', 'Development', 'End-to-end web development covering both frontend and backend technologies'),
  ('Mobile Development - iOS', 'Development', 'Native iOS app development using Swift and the Apple ecosystem'),
  ('Mobile Development - Android', 'Development', 'Native Android app development using Kotlin or Java'),
  ('Mobile Development - Cross-platform', 'Development', 'Cross-platform mobile development using React Native, Flutter, or similar frameworks'),
  ('DevOps Engineering', 'Development', 'Infrastructure automation, CI/CD pipelines, cloud deployment, monitoring, and system reliability'),
  ('Data Engineering', 'Development', 'Building data pipelines, ETL processes, data warehousing, and analytics infrastructure'),
  ('Machine Learning Engineering', 'Development', 'Developing and deploying machine learning models, training pipelines, and ML infrastructure'),
  ('QA Engineering', 'Development', 'Quality assurance, test automation, manual testing, and ensuring software quality'),
  ('Security Engineering', 'Development', 'Application security, penetration testing, security audits, and secure coding practices'),

  -- Product
  ('Product Management', 'Product', 'Product strategy, roadmap planning, user research, and cross-functional team leadership'),
  ('Product Owner', 'Product', 'Agile product ownership, backlog management, sprint planning, and stakeholder communication'),
  ('Product Strategy', 'Product', 'High-level product vision, market analysis, competitive positioning, and strategic planning'),
  ('Growth Product Manager', 'Product', 'Growth-focused product management including experimentation, analytics, and conversion optimization'),
  ('Technical Product Manager', 'Product', 'Product management with deep technical expertise, often working on developer tools or platform products'),

  -- Content & Writing
  ('Copywriting', 'Content', 'Marketing copy, website content, advertising copy, and persuasive writing'),
  ('Content Strategy', 'Content', 'Content planning, editorial calendars, content governance, and strategic storytelling'),
  ('Technical Writing', 'Content', 'Documentation, user guides, API docs, and technical communication'),
  ('UX Writing', 'Content', 'Microcopy, in-app messaging, error messages, and product content'),
  ('Social Media Management', 'Content', 'Social media strategy, content creation, community management, and social analytics'),
  ('SEO Specialist', 'Content', 'Search engine optimization, keyword research, on-page optimization, and content optimization'),
  ('Content Marketing', 'Content', 'Blog writing, thought leadership, content distribution, and inbound marketing'),

  -- Marketing
  ('Performance Marketing', 'Marketing', 'Paid advertising, PPC campaigns, conversion optimization, and ROI-focused marketing'),
  ('Brand Marketing', 'Marketing', 'Brand positioning, brand campaigns, brand awareness, and emotional storytelling'),
  ('Email Marketing', 'Marketing', 'Email campaign strategy, automation, segmentation, and lifecycle marketing'),
  ('Marketing Operations', 'Marketing', 'Marketing technology stack, automation, analytics, and process optimization'),
  ('Demand Generation', 'Marketing', 'Lead generation, nurture campaigns, and pipeline acceleration'),
  ('Event Marketing', 'Marketing', 'Event planning, conference marketing, webinars, and experiential marketing'),
  ('Influencer Marketing', 'Marketing', 'Influencer partnerships, creator collaborations, and influencer campaign management'),

  -- Data & Analytics
  ('Data Analysis', 'Data', 'Data interpretation, SQL queries, dashboard creation, and business insights'),
  ('Business Intelligence', 'Data', 'BI tools, reporting, data visualization, and executive dashboards'),
  ('Data Science', 'Data', 'Statistical analysis, predictive modeling, machine learning, and advanced analytics'),
  ('Analytics Engineering', 'Data', 'dbt, data transformation, analytics infrastructure, and data modeling'),

  -- Operations & Management
  ('Project Management', 'Operations', 'Project planning, timeline management, resource allocation, and stakeholder coordination'),
  ('Operations Manager', 'Operations', 'Process optimization, operational efficiency, team coordination, and execution'),
  ('Chief of Staff', 'Operations', 'Executive support, strategic initiatives, cross-functional coordination, and special projects'),
  ('Program Management', 'Operations', 'Multi-project oversight, program strategy, and large-scale initiative coordination'),
  ('Scrum Master', 'Operations', 'Agile facilitation, sprint ceremonies, team coaching, and impediment removal'),

  -- Strategy & Business
  ('Business Strategy', 'Strategy', 'Strategic planning, market analysis, competitive strategy, and business model design'),
  ('Go-to-Market Strategy', 'Strategy', 'Product launches, market entry, positioning, and revenue strategy'),
  ('Partnerships', 'Strategy', 'Partnership development, alliance management, and channel strategy'),
  ('Management Consulting', 'Strategy', 'Business advisory, organizational design, transformation, and strategic recommendations'),

  -- Sales & Business Development
  ('Sales', 'Sales', 'Consultative selling, deal closing, pipeline management, and revenue generation'),
  ('Business Development', 'Sales', 'Partnership development, new market entry, strategic deals, and growth opportunities'),
  ('Account Management', 'Sales', 'Client relationships, account growth, upselling, and customer success'),
  ('Sales Operations', 'Sales', 'Sales tools, CRM management, forecasting, and sales enablement'),

  -- Creative & Production
  ('Video Production', 'Creative', 'Video filming, editing, directing, and post-production for marketing or entertainment'),
  ('Photography', 'Creative', 'Commercial photography, product photography, and visual storytelling'),
  ('Audio Production', 'Creative', 'Sound design, audio editing, music production, and podcast production'),
  ('Podcast Production', 'Creative', 'Podcast editing, show production, audio engineering, and distribution'),
  ('Creative Direction', 'Creative', 'Creative vision, campaign concepts, art direction, and team leadership'),

  -- Specialized Roles
  ('User Research', 'Research', 'User interviews, usability testing, research synthesis, and insights generation'),
  ('Customer Success', 'Customer', 'Client onboarding, adoption, retention, and expansion'),
  ('Community Management', 'Customer', 'Community building, engagement, moderation, and advocacy programs'),
  ('HR & Recruiting', 'People', 'Talent acquisition, interviewing, candidate experience, and hiring strategy'),
  ('Learning & Development', 'People', 'Training programs, coaching, professional development, and organizational learning'),
  ('Finance & Accounting', 'Finance', 'Financial planning, accounting, bookkeeping, and financial analysis'),
  ('Legal & Compliance', 'Legal', 'Contract review, legal advisory, compliance, and risk management');
