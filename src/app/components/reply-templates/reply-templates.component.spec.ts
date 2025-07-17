import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplyTemplatesComponent } from './reply-templates.component';

describe('ReplyTemplatesComponent', () => {
  let component: ReplyTemplatesComponent;
  let fixture: ComponentFixture<ReplyTemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReplyTemplatesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReplyTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
