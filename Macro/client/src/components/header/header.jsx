import '../../index.css'
import { heroImg, defaultProfile } from '../../assets/assets.js'
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth'
import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Button,
} from "@material-tailwind/react";

function Header({ radio, user }) {
  const nav = useNavigate();

  async function handleLogout() {
    await logout()
    nav('/login')
  }

  return (
    <header>
      <div className="text-[#B68EDA] bg-[#160f20] w-full h-25 flex items-center shadow-[0px_4px_6px_rgba(0,0,0,0.2)] px-3.75">
        <div className="absolute right-0.5 z-50 flex items-center gap-3">
          <div className="absolute w-60 right-5 z-50 flex items-center gap-3">
            <Menu>
              <MenuHandler className="text-[#B68EDA] font-['Nunito'] p-3 w-40 bg-linear-to-br from-[#1f152e]/40 to-[#8726B7]/1 border border-gray-300/10 shadow-black rounded-xl">
                <Button className="left-2 w-full">
                  <span className="flex items-center justify-between w-full gap-2 hover:underline cursor-pointer">
                    {user?.displayName || user?.email || 'Account'}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 right-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </Button>
              </MenuHandler>
              <MenuList className="text-[#B68EDA] p-3 w-40 bg-linear-to-br from-[#1f152e]/80 to-[#8726B7]/1 border border-gray-300/10 shadow-black rounded-xl">
                <MenuItem className="py-3 hover:underline cursor-pointer" onClick={() => nav('/profile')}>Profile</MenuItem>
                <MenuItem className="py-3 hover:underline cursor-pointer" onClick={() => nav('/dashboard')}>Home</MenuItem>
                <MenuItem className="py-3 hover:underline cursor-pointer">Account Settings</MenuItem>
                <MenuItem className="py-3 hover:underline cursor-pointer" onClick={handleLogout}>Logout</MenuItem>
              </MenuList>
            </Menu>
            <img className="w-15 rounded-full" src={user?.photoURL || defaultProfile} />
          </div>
        </div>

        <div className="absolute left-4 flex items-center z-6 drop-shadow-[0_0_2px_#B68EDA]">
          <img className="w-43.75" src={heroImg} />
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 z-7">
          {radio}
        </div>
      </div>
    </header>
  );
}

export default Header