import '../../index.css'
import { defaultProfile2 } from '../../assets/assets.js'

function Module() {
    return(
        <div>
            <div className="isolate h-120 w-200 rounded-xl bg-linear-to-br from-[#EABFFF]/20 to-[#8726B7]/1 shadow-lg ring-1 ring-[#D298FF]/20">
                <div className="w-100% h-20 flex items-center">
                    <img className="w-12 h-12 rounded-full shrink-0 ml-4" src={defaultProfile2}></img>
                    <span className=" w-50 px-5 py-5 font-['Nunito'] text-[#B68EDA] text-[20px]">Unknown User</span>
                </div>
                <div className="w-100% h-12 flex items-center justify-center">
                    {/*
                    Post Types:
                    "Made a new Playlist: [PLAYLIST NAME]
                    "Made a new Review: [GAME NAME]
                    "[USER] Added to Played Games: [GAME NAME]"
                    */}

                    <div className="w-158 h-12">
                        <span className=" w-50 py-5 font-['Nunito'] text-[#B68EDA] text-[20px]">Made a new Playlist:</span>
                        <span className="font-['Nunito'] text-[#E4CAFB] text-[20px]"> Playlist</span>   
                    </div>
                    
                </div>
            </div>
        </div>
    );
}
//#8726B7

export default Module