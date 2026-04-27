import '../../index.css'

function Radio() {
    return(
        <div>
            <div className="flex w-120 space-x-2 bg-linear-to-br from-[#1f152e]/40 to-[#8726B7]/1 border border-gray-300/10 shadow-black rounded-xl select-none font-['Nunito']">
                <label className="radio flex grow items-center justify-center rounded-lg p-1 cursor-pointer hover:underline ">
                    <input
                    type="radio"
                    name="radio"
                    value="html"
                    className="peer hidden"
                    defaultChecked=""
                    />
                    <span
                    className="tracking-widest peer-checked:bg-linear-to-r peer-checked:from-[blueviolet] peer-checked:to-[violet] peer-checked:text-white ext-[#B68EDA] p-2 rounded-lg transition duration-150 ease-in-out"
                    >Trending</span>
                </label>

                <label className="radio flex grow items-center justify-center rounded-lg p-1 cursor-pointer hover:underline">
                    <input type="radio" name="radio" value="react" className="peer hidden" />
                    <span
                    className="tracking-widest peer-checked:bg-linear-to-r peer-checked:from-[blueviolet] peer-checked:to-[violet] peer-checked:text-white ext-[#B68EDA] p-2 rounded-lg transition duration-150 ease-in-out"
                    >Your Feed</span>
                </label>

                <label className="radio flex grow items-center justify-center rounded-lg p-1 cursor-pointer hover:underline">
                    <input type="radio" name="radio" value="vue" className="peer hidden" />
                    <span
                    className="tracking-widest peer-checked:bg-linear-to-r peer-checked:from-[blueviolet] peer-checked:to-[violet] peer-checked:text-white text-[#B68EDA] p-2 rounded-lg transition duration-150 ease-in-out"
                    >Friends</span>
                </label>
            </div>
        </div>
    );
}
//#8726B7

export default Radio