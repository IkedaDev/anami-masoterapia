export interface PageData {
  meta: Meta;
  pages: Pages;
}

export interface Meta {}

export interface Pages {
  shared: Shared;
  page_1: Page1;
  page_2: Page2;
  page_3: Page3;
  page_4: Page4;
}

export interface Page1 {
  section_1: Page1_Section1;
  section_2: Section2_Element;
}

export interface Page1_Section1 {
  title: string;
}

export interface Section2_Element {
  title: string;
  text_1: string;
}

export interface Page2 {
  section_1: Page2_Section1;
  section_2: Page2_Section2;
}

export interface Page2_Section1 {
  title: string;
  text_1: string;
  text_2: string;
}

export interface Page2_Section2 {
  title: string;
  text_1: Text1[];
}

export interface Text1 {
  name: string;
  duration: string;
  price: number;
}

export interface Page3 {
  section_1: Page1_Section1;
  section_2: Meta;
  section_3: Section3;
}

export interface Section3 {
  title: string;
  text_1: string;
  text_2: Section2_Element[];
}

export interface Page4 {
  section_1: Page1_Section1;
  section_2: Page4_Section2;
}

export interface Page4_Section2 {
  text_1: string;
  text_2: string;
}

export interface Shared {
  shared_1: Section2_Element;
}
