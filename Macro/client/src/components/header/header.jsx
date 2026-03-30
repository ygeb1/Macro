import './header.css'
import { heroImg } from '../../assets/assets.js'

function Header() {
    return(
        <header>
            <div className="header">
                <div className="header-label">
                    <img id="headerImg" src={heroImg}></img>
                </div>
            </div>
        </header>
    );
}

export default Header