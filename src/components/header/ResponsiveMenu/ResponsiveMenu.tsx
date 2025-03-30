import type { MenuItem } from "@/interfaces";
import React, { useEffect, useRef } from "react";
import "./ResponsiveMenu.css";
interface Props {
  menuItems: MenuItem[];
}

const ResponsiveMenu: React.FC<Props> = ({ menuItems }) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    btnRef.current?.classList.toggle("is-active");
    menuRef.current?.classList.toggle("is-active-responsive-menu");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current || !btnRef.current) return;

      if (
        !menuRef.current.contains(event.target as Node) &&
        !btnRef.current.contains(event.target as Node)
      ) {
        btnRef.current.classList.remove("is-active");
        menuRef.current.classList.remove("is-active-responsive-menu");
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="sm:hidden">
        <button
          onClick={toggleMenu}
          ref={btnRef}
          className="hamburger hamburger--collapse"
          id="menu-btn"
          type="button"
        >
          <span className="hamburger-box">
            <span className="hamburger-inner"></span>
          </span>
        </button>
      </div>
      <nav
        ref={menuRef}
        className="responsive-menu sm:hidden absolute right-[-200px] top-[90px] w-max bg-white flex flex-col gap-3 px-4 shadow py-3 duration-300 transition-all"
      >
        {menuItems.map(({ label, link }, index) => (
          <a
            key={index}
            className="px-2 py-1 transition hover:bg-[#ebd9bd] cursor-pointer"
            href={link}
          >
            {label}
          </a>
        ))}
      </nav>
    </>
  );
};

export default ResponsiveMenu;
