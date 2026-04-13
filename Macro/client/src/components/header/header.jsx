import '../../index.css'
import { heroImg } from '../../assets/assets.js'
import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Button,
} from "@material-tailwind/react";

function Header({ radio }) {
    return(
        <header>
            <div className="text-[#B68EDA] bg-[#160f20] w-full h-25 flex items-center shadow-[0px_4px_6px_rgba(0,0,0,0.2)] px-3.75">
                <div className="absolute right-10 z-50">
                    <Menu>
                        <MenuHandler className="text-[#B68EDA] font-['Nunito'] p-3 w-40 bg-linear-to-br from-[#1f152e]/40 to-[#8726B7]/1 border border-gray-300/10 shadow-black rounded-xl">
                            <Button>Terpguy123</Button>   
                        </MenuHandler>
                        <MenuList className=" text-[#B68EDA] p-3 w-40 bg-linear-to-br from-[#1f152e]/80 to-[#8726B7]/1 border border-gray-300/10 shadow-black rounded-xl">
                            <MenuItem className="py-3">Profile</MenuItem>
                            <MenuItem className="py-3">Account Settings</MenuItem>
                            <MenuItem className="py-3">Logout</MenuItem>
                        </MenuList>
                    </Menu>   
                </div>
                <div className="absolute left-4 flex items-center z-6 drop-shadow-[0_0_2px_#B68EDA]">
                    <img className="w-43.75" src={heroImg}></img>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 z-7">
                    {radio}    
                </div>
            </div>
        </header>
    );
}

export default Header