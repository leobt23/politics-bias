import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './navbar.css';

const navItems = [
  { name: 'Início', href: '#inicio' },
  { name: 'Análises', href: '#analises' },
  { name: 'Sondagens', href: '#sondagens' },
  { name: 'Programas', href: '#programas' },
  { name: 'Assistente', href: '#assistente' },
];

const Navbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <>
      <div className="edition-bar">
        <div className="edition-bar__inner">
          <span>Jornal independente de análise política</span>
          <span className="edition-bar__meta">Portugal · Dados, contexto e contraditório</span>
        </div>
      </div>

      <header className="site-header">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" aria-label="115 e meio — página inicial">
            <span className="logo-number">115</span>
            <span className="logo-words">e<br />meio</span>
          </Link>

          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>

          <nav
            id="primary-navigation"
            className={`nav-menu ${menuOpen ? 'nav-menu--open' : ''}`}
            aria-label="Navegação principal"
          >
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="nav-item">
                {item.name}
              </a>
            ))}
          </nav>

          <a className="header-cta" href="#sondagens">
            Explorar dados <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>
    </>
  );
};

export default Navbar;
