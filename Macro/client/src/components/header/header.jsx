import '../../index.css'
import { heroImg } from '../../assets/assets.js'
import { logout } from '../../auth'

function Header({ radio, user }) {
    async function handleLogout() {
        await logout()
    }

    return(
        <header>
            <div className="text-[#B68EDA] bg-[#160f20] w-full h-25 flex items-center shadow-[0px_4px_6px_rgba(0,0,0,0.2)] relative z-4 px-3.75">
                <div className="absolute left-4 flex items-center z-6 drop-shadow-[0_0_2px_#B68EDA]">
                    <img className="w-43.75" src={heroImg}></img>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 z-7">
                    {radio}    
                </div>
                <div className="absolute right-4 flex items-center gap-4 z-6">
                    {user && (
                        <>
                            <span className="text-sm text-[#B68EDA]">
                                {user.displayName || user.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1.5 text-sm text-white bg-purple-700 rounded-lg hover:bg-purple-900 transition-colors"
                            >
                                Sign out
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header