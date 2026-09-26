import fs from 'fs';
import path from 'path';
import { seedProjects } from './seedProjects';

const DB_PATH = path.join(process.cwd(), 'infrapulse_db.json');

// Interface definition for our simple DB
interface DatabaseSchema {
  users: {
    [userId: string]: {
      role: string;
      name: string;
      password?: string;
      sector?: string;
      pinnedProjects?: string[];
    };
  };
  projects: any[];
}

// Initial state if file doesn't exist
const DEFAULT_DB: DatabaseSchema = {
  users: {
    'master_admin': {
      role: 'master',
      name: 'Prime Node (Master)',
      password: 'password123',
      sector: 'ALL',
      pinnedProjects: []
    },
    'user_nodal_1': {
      role: 'nodal',
      name: 'Ramesh Kumar (Nodal Officer)',
      password: 'nodal',
      pinnedProjects: ['RAIL-MAHSR-01'],
    },
    'user_nodal_2': {
      role: 'nodal',
      name: 'Nodal Officer - Udhampur-Srinagar-Ba',
      password: 'nodal',
      pinnedProjects: ['RAIL-USBRL-02'],
    },
    'user_nodal_3': {
      role: 'nodal',
      name: 'Nodal Officer - Navi Mumbai Internat',
      password: 'nodal',
      pinnedProjects: ['AVI-NMIA-03'],
    },
    'user_nodal_4': {
      role: 'nodal',
      name: 'Nodal Officer - Polavaram Irrigation',
      password: 'nodal',
      pinnedProjects: ['WTR-POLA-04'],
    },
    'user_nodal_5': {
      role: 'nodal',
      name: 'Nodal Officer - Subansiri Lower Hydr',
      password: 'nodal',
      pinnedProjects: ['PWR-SUB-05'],
    },
    'user_nodal_6': {
      role: 'nodal',
      name: 'Nodal Officer - Delhi-Meerut Regiona',
      password: 'nodal',
      pinnedProjects: ['URB-RRTS-06'],
    },
    'user_nodal_7': {
      role: 'nodal',
      name: 'Nodal Officer - Kudankulam Nuclear P',
      password: 'nodal',
      pinnedProjects: ['PWR-KUD-07'],
    },
    'user_nodal_8': {
      role: 'nodal',
      name: 'Nodal Officer - Eastern Dedicated Fr',
      password: 'nodal',
      pinnedProjects: ['RAIL-EDFC-08'],
    },
    'user_nodal_9': {
      role: 'nodal',
      name: 'Nodal Officer - Mumbai Trans Harbour',
      password: 'nodal',
      pinnedProjects: ['ROAD-MTHL-09'],
    },
    'user_nodal_10': {
      role: 'nodal',
      name: 'Nodal Officer - Kaleshwaram Lift Irr',
      password: 'nodal',
      pinnedProjects: ['WTR-KLE-10'],
    },
    'user_nodal_11': {
      role: 'nodal',
      name: 'Nodal Officer - Bharatmala Pariyojan',
      password: 'nodal',
      pinnedProjects: ['ROAD-BHARAT-11'],
    },
    'user_nodal_12': {
      role: 'nodal',
      name: 'Nodal Officer - Zojila Tunnel Projec',
      password: 'nodal',
      pinnedProjects: ['ROAD-ZOJI-12'],
    },
    'user_ministry_1': {
      role: 'ministry',
      name: 'Aditi Sharma (Ministry Analyst)',
      password: 'ministry',
      sector: 'Railways',
      pinnedProjects: [],
    },
    'user_apex_1': {
      role: 'apex',
      name: 'Secretary, Railways',
      password: 'apex',
      sector: 'Railways',
      pinnedProjects: [],
    }
  },
  projects: seedProjects, // Load from static seed data initially
};

export class CacheManager {
  private static instance: CacheManager;
  private db: DatabaseSchema;

  private constructor() {
    this.db = this.loadDatabase();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_PATH)) {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to read db file, falling back to default', error);
    }
    
    // If we reach here, either it doesn't exist or we failed to parse it
    this.saveDatabase(DEFAULT_DB);
    return DEFAULT_DB;
  }

  private saveDatabase(data?: DatabaseSchema) {
    if (data) {
      this.db = data;
    }
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save db file', error);
    }
  }

  // Projects API
  public getProjects() {
    return this.db.projects;
  }

  public updateProject(updatedProject: any) {
    const index = this.db.projects.findIndex(p => p.project_id === updatedProject.project_id || p.id === updatedProject.id);
    if (index !== -1) {
      this.db.projects[index] = { ...this.db.projects[index], ...updatedProject };
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public addProject(newProject: any) {
    this.db.projects.push(newProject);
    this.saveDatabase();
    return newProject;
  }

  // Users API
  public getUser(userId: string) {
    return this.db.users[userId] || null;
  }

  public authenticateUser(userId: string, password?: string) {
    const user = this.db.users[userId];
    if (user && user.password === password) {
      const { password, ...safeUser } = user;
      return { id: userId, ...safeUser };
    }
    return null;
  }

  public getUsers() {
    return this.db.users;
  }

  public updateUserPreferences(userId: string, prefs: any) {
    if (this.db.users[userId]) {
      this.db.users[userId] = { ...this.db.users[userId], ...prefs };
      this.saveDatabase();
      return this.db.users[userId];
    }
    return null;
  }
}
