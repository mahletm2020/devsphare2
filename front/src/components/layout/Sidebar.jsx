import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/auth';

const linkBase =
  'block px-4 py-2 rounded-lg text-sm font-medium transition-colors';

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles?.map((r) => r.name) || [];

  const isOrganizer = roles.includes('organizer') || roles.includes('super_admin');
  const isSponsor = roles.includes('sponsor');
  const isJudge = (user?.judgeHackathons || []).length > 0;

  return (
    <aside className="w-60 bg-white border-r border-[#E9E9E9] p-4 flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Participant
        </p>
        <nav className="flex flex-col gap-1">
          <NavLink
            to="/participant/dashboard"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive ? 'bg-[#00D4D4] text-white' : 'text-[#1A1A1A] hover:bg-[#D9FFFF]'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/participant/team"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive ? 'bg-[#00D4D4] text-white' : 'text-[#1A1A1A] hover:bg-[#D9FFFF]'
              }`
            }
          >
            My Team
          </NavLink>
          <NavLink
            to="/participant/submit"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive ? 'bg-[#00D4D4] text-white' : 'text-[#1A1A1A] hover:bg-[#D9FFFF]'
              }`
            }
          >
            Submit Project
          </NavLink>
        </nav>
      </div>

      {isOrganizer && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Organizer
          </p>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/organizer/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-[#00D4D4] text-white'
                    : 'text-[#1A1A1A] hover:bg-[#D9FFFF]'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/organizer/hackathons/create"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-[#00D4D4] text-white'
                    : 'text-[#1A1A1A] hover:bg-[#D9FFFF]'
                }`
              }
            >
              Create Hackathon
            </NavLink>
          </nav>
        </div>
      )}

      {isJudge && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Judge</p>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/judge/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-[#00D4D4] text-white'
                    : 'text-[#1A1A1A] hover:bg-[#D9FFFF]'
                }`
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </div>
      )}

      {isSponsor && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Sponsor
          </p>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/sponsor/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-[#00D4D4] text-white'
                    : 'text-[#1A1A1A] hover:bg-[#D9FFFF]'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/sponsor/ads"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-[#00D4D4] text-white'
                    : 'text-[#1A1A1A] hover:bg-[#D9FFFF]'
                }`
              }
            >
              Sponsor Ads
            </NavLink>
          </nav>
        </div>
      )}
    </aside>
  );
}




